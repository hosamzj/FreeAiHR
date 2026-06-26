import { NextRequest } from 'next/server';
import { success, error } from '@/lib/auth';
import { parseEmlFile, isResumeEmail, isResumeAttachment, extractAttachmentText } from '@/lib/eml-parser';
import { extractCandidateFromText } from '@/lib/ai';

// POST /api/candidates/parse-eml - AI 解析拖拽上传的 .eml 邮件文件
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return error(422, '请上传 .eml 邮件文件');
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.eml') && !fileName.endsWith('.msg')) {
      return error(422, '仅支持 .eml 格式的邮件文件，请从 Outlook 中拖拽邮件到桌面后再上传');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 解析 .eml 文件
    const parsed = await parseEmlFile(buffer);
    const isResume = isResumeEmail(parsed);

    // 提取简历附件内容
    const resumeAttachments = parsed.attachments.filter((att) => isResumeAttachment(att.filename));
    const attachmentTexts = resumeAttachments.map((att) => extractAttachmentText(att));

    // 构建 AI 解析上下文
    const contextParts: string[] = [];
    if (parsed.subject) contextParts.push(`邮件主题: ${parsed.subject}`);
    if (parsed.from) contextParts.push(`发件人: ${parsed.from}`);
    if (parsed.date) contextParts.push(`发送时间: ${new Date(parsed.date).toLocaleString('zh-CN')}`);

    let bodyText = parsed.bodyText || '';
    if (!bodyText && parsed.bodyHtml) {
      bodyText = parsed.bodyHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    if (bodyText) contextParts.push(`邮件正文:\n${bodyText.substring(0, 3000)}`);
    if (attachmentTexts.length > 0) contextParts.push(`\n附件内容:\n${attachmentTexts.join('\n---\n')}`);

    const fullContext = contextParts.join('\n\n');

    // AI 提取候选人信息
    const aiParsed = await extractCandidateFromText(fullContext);

    // 兜底：从发件人提取邮箱
    const fromEmail = parsed.from?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || null;

    return success({
      source: 'email',
      isResume,
      emailInfo: {
        from: parsed.from,
        to: parsed.to,
        subject: parsed.subject,
        date: parsed.date,
        hasAttachments: parsed.attachments.length > 0,
        attachmentCount: parsed.attachments.length,
        resumeAttachmentCount: resumeAttachments.length,
        attachmentNames: parsed.attachments.map((a) => a.filename),
      },
      bodyPreview: bodyText.substring(0, 500),
      aiParsed: {
        name: aiParsed.name || null,
        email: aiParsed.email || fromEmail,
        phone: aiParsed.phone || null,
        education: aiParsed.education || null,
        school: aiParsed.school || null,
        major: aiParsed.major || null,
        experience: aiParsed.experience || null,
        currentCompany: aiParsed.currentCompany || null,
        currentPosition: aiParsed.currentPosition || null,
        skills: Array.isArray(aiParsed.skills) ? aiParsed.skills : [],
        expectedSalary: aiParsed.expectedSalary || null,
        location: aiParsed.location || null,
        appliedPosition: aiParsed.appliedPosition || null,
      },
    });
  } catch (e) {
    console.error('Parse EML error:', e);
    return error(500, '邮件解析失败，请确认文件格式正确');
  }
}
