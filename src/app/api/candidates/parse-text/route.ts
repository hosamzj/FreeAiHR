import { NextRequest } from 'next/server';
import { success, error } from '@/lib/auth';

// POST /api/candidates/parse-text - 解析粘贴的邮件/简历文本
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || text.trim().length < 10) {
      return error(422, '请粘贴完整的邮件或简历内容');
    }

    // Try AI parsing
    let aiParsed: Record<string, unknown> | null = null;
    try {
      const { callLLM } = await import('@/lib/ai');
      const aiResult = await callLLM(
        `请从以下文本中提取候选人简历信息，输出JSON格式：

${text.substring(0, 4000)}

请提取以下字段（如果文本中不存在则设为null）：
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
- appliedPosition: 应聘岗位`,
        { systemPrompt: '你是一位专业的简历解析专家，从文本中提取候选人信息。只返回JSON，不要其他内容。' }
      );

      if (aiResult) {
        try {
          const jsonStr = typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult);
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiParsed = JSON.parse(jsonMatch[0]);
          }
        } catch {
          // Parse failed
        }
      }
    } catch {
      // AI parsing failed
    }

    // Fallback: extract email from text
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/1[3-9]\d{9}/);

    return success({
      source: 'clipboard',
      aiParsed: aiParsed || {
        name: null,
        email: emailMatch?.[0] || null,
        phone: phoneMatch?.[0] || null,
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
      textPreview: text.substring(0, 300),
    });
  } catch (e) {
    console.error('Parse text error:', e);
    return error(500, '文本解析失败');
  }
}
