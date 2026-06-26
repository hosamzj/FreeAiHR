import { LLMClient, Config } from 'coze-coding-dev-sdk';
import type { Message } from 'coze-coding-dev-sdk';

/**
 * 简历解析结果类型
 */
export interface ParsedResume {
  name: string;
  phone: string;
  email: string;
  gender?: string;
  age?: number;
  location?: string;
  education: {
    school: string;
    degree: string;
    major: string;
    startDate?: string;
    endDate?: string;
  }[];
  workExperience: {
    company: string;
    position: string;
    startDate?: string;
    endDate?: string;
    description: string;
  }[];
  skills: string[];
  certificates?: string[];
  languages?: string[];
  summary?: string;
  expectedSalary?: string;
  expectedPosition?: string;
}

/**
 * 调用 LLM 进行简历解析
 * 支持文本输入和多模态（图片/PDF base64）
 */
export async function parseResumeWithLLM(
  content: string | { type: 'text'; text: string } | { type: 'image'; base64: string; mimeType: string },
): Promise<ParsedResume> {
  const config = new Config();
  const client = new LLMClient(config);

  const systemPrompt = `你是一位专业的简历解析专家。请从简历中提取以下结构化信息，严格按 JSON 格式输出。

输出 JSON 格式要求：
{
  "name": "姓名",
  "phone": "手机号",
  "email": "邮箱",
  "gender": "性别（男/女，无法判断则省略）",
  "age": 年龄数字（无法判断则省略）,
  "location": "所在城市",
  "education": [
    { "school": "学校全称", "degree": "学历（如本科/硕士/博士）", "major": "专业", "startDate": "开始时间", "endDate": "结束时间" }
  ],
  "workExperience": [
    { "company": "公司全称", "position": "职位", "startDate": "开始时间", "endDate": "结束时间", "description": "工作描述摘要" }
  ],
  "skills": ["技能1", "技能2"],
  "certificates": ["证书1"],
  "languages": ["语言及水平"],
  "summary": "个人总结（1-2句话）",
  "expectedSalary": "期望薪资（如有）",
  "expectedPosition": "期望职位（如有）"
}

规则：
1. 仅输出 JSON，不要任何额外文字
2. 缺失字段可省略或设为空数组
3. 日期格式统一为 YYYY-MM 或 YYYY
4. 学校名、公司名保持原始全称
5. 技能列表提取所有明确提到的技术/工具/框架`;

  const messages: Message[] = typeof content === 'string'
    ? [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请解析以下简历内容：\n\n${content.substring(0, 8000)}` },
      ]
    : content.type === 'text'
    ? [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请解析以下简历内容：\n\n${content.text.substring(0, 8000)}` },
      ]
    : [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text' as const, text: '请解析这张简历图片，提取所有结构化信息。' },
            {
              type: 'image_url' as const,
              image_url: {
                url: `data:${content.mimeType};base64,${content.base64}`,
                detail: 'high' as const,
              },
            },
          ],
        },
      ];

  const response = await client.invoke(messages, {
    model: 'doubao-seed-2-0-lite-260215',
    temperature: 0.1,
    thinking: 'disabled',
  });

  // 解析 LLM 返回的 JSON
  const rawContent = response.content || '';
  // 尝试提取 JSON（可能被 markdown 代码块包裹）
  const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || rawContent.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawContent.trim();

  try {
    const parsed = JSON.parse(jsonStr) as ParsedResume;
    return {
      name: parsed.name || '',
      phone: parsed.phone || '',
      email: parsed.email || '',
      gender: parsed.gender,
      age: parsed.age,
      location: parsed.location,
      education: Array.isArray(parsed.education) ? parsed.education : [],
      workExperience: Array.isArray(parsed.workExperience) ? parsed.workExperience : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      certificates: Array.isArray(parsed.certificates) ? parsed.certificates : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages : [],
      summary: parsed.summary,
      expectedSalary: parsed.expectedSalary,
      expectedPosition: parsed.expectedPosition,
    };
  } catch {
    // JSON 解析失败，尝试从原始文本中提取
    console.error('[parseResume] JSON parse failed, raw:', rawContent.substring(0, 500));
    return {
      name: '',
      phone: '',
      email: '',
      education: [],
      workExperience: [],
      skills: [],
      summary: rawContent.substring(0, 200),
    };
  }
}

/**
 * 调用 LLM 进行通用文本生成（保持向后兼容）
 */
export async function callLLM(
  prompt: string,
  options: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const config = new Config();
  const client = new LLMClient(config);

  const messages: { role: 'system' | 'user'; content: string }[] = [];
  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await client.invoke(messages, {
    model: 'doubao-seed-2-0-lite-260215',
    temperature: options.temperature ?? 0.7,
    thinking: 'disabled',
  });

  return response.content || '';
}

// 别名导出 - 供 API 路由使用
export const generateAIContent = callLLM;
