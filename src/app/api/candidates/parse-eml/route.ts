import { NextRequest } from 'next/server';
import { success, error } from '@/lib/auth';
import { parseEmlFile, isResumeEmail, isResumeAttachment, extractAttachmentText } from '@/lib/eml-parser';

// POST /api/candidates/parse-eml - 解析拖拽上传的 .eml 邮件文件
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return error(422, '请上传 .eml 邮件文件');
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.eml') && !fileName.endsWith('.msg')) {
      return error(422, '仅支持 .eml 格式的邮件文件，请从 Outlook 中拖拽邮件到桌面后再上传');
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the .eml file
    const parsed = await parseEmlFile(buffer);

    // Check if it's a resume email
    const isResume = isResumeEmail(parsed);

    // Extract resume attachments
    const resumeAttachments = parsed.attachments.filter((att) => isResumeAttachment(att.filename));
    const attachmentTexts = resumeAttachments.map((att) => extractAttachmentText(att));

    // Build context for AI parsing
    const contextParts: string[] = [];

    if (parsed.subject) {
      contextParts.push(`邮件主题: ${parsed.subject}`);
    }
    if (parsed.from) {
      contextParts.push(`发件人: ${parsed.from}`);
    }
    if (parsed.date) {
      contextParts.push(`发送时间: ${new Date(parsed.date).toLocaleString('zh-CN')}`);
    }

    // Use body text for parsing
    let bodyText = parsed.bodyText || '';
    // Strip HTML tags if only HTML body available
    if (!bodyText && parsed.bodyHtml) {
      bodyText = parsed.bodyHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    if (bodyText) {
      contextParts.push(`邮件正文:\n${bodyText.substring(0, 3000)}`);
    }

    // Add attachment info
    if (attachmentTexts.length > 0) {
      contextParts.push(`\n附件内容:\n${attachmentTexts.join('\n---\n')}`);
    }

    const fullContext = contextParts.join('\n\n');

    // Try AI parsing
    let aiParsed: Record<string, unknown> | null = null;
    try {
      const { callLLM } = await import('@/lib/ai');
      const aiResult = await callLLM(
        `请从以下邮件内容中提取候选人简历信息，输出JSON格式：

${fullContext}

请提取以下字段（如果邮件中不存在则设为null）：
- name: 姓名
- email: 邮箱地址
- phone: 手机号码
- education: 学历（如"本科"、"硕士"）
- school: 毕业院校
- major: 专业
- experience: 工作年限（数字）
- currentCompany: 当前公司
- currentPosition: 当前职位
- skills: 技能列表（数组）
- expectedSalary: 期望薪资
- location: 所在城市
- appliedPosition: 应聘岗位（从邮件主题或正文推断）`,
        { systemPrompt: '你是一位专业的简历解析专家，从邮件内容中提取候选人信息。只返回JSON，不要其他内容。' }
      );

      if (aiResult) {
        try {
          // callLLM returns string, try to parse JSON
          const jsonStr = typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult);
          // Extract JSON from possible markdown code block
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiParsed = JSON.parse(jsonMatch[0]);
          }
        } catch {
          // Parse failed, use null
        }
      }
    } catch {
      // AI parsing failed, continue with basic info
    }

    // Build result
    const result = {
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
      aiParsed: aiParsed || {
        name: null,
        email: parsed.from.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || null,
        phone: null,
        education: null,
        school: null,
        major: null,
        experience: null,
        currentCompany: null,
        currentPosition: null,
        skills: [],
        expectedSalary: null,
        location: null,
        appliedPosition: null,
      },
    };

    return success(result);
  } catch (e) {
    console.error('Parse EML error:', e);
    return error(500, '邮件解析失败，请确认文件格式正确');
  }
}
