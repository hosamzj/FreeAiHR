import { NextRequest } from 'next/server';
import { success, error } from '@/lib/auth';
import { extractCandidateFromText } from '@/lib/ai';

// POST /api/candidates/parse-text - AI 解析粘贴的邮件/简历文本
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || text.trim().length < 10) {
      return error(422, '请粘贴完整的邮件或简历内容');
    }

    // 使用 AI 提取候选人信息
    const aiParsed = await extractCandidateFromText(text);

    // 兜底：正则提取邮箱和电话
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/1[3-9]\d{9}/);

    return success({
      source: 'clipboard',
      aiParsed: {
        name: aiParsed.name || null,
        email: aiParsed.email || emailMatch?.[0] || null,
        phone: aiParsed.phone || phoneMatch?.[0] || null,
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
      textPreview: text.substring(0, 300),
    });
  } catch (e) {
    console.error('Parse text error:', e);
    return error(500, '文本解析失败');
  }
}
