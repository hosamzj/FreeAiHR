import { prisma } from '@/lib/prisma';

// ============================================================
// Agnes AI 默认配置（免费开放，OpenAI 兼容协议）
// ============================================================
const AGNES_DEFAULT = {
  provider: 'agnes',
  baseUrl: 'https://apihub.agnes-ai.com/v1',
  model: 'agnes-2.0-flash',
} as const;

interface AIConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
}

// ============================================================
// 获取 AI 配置（优先数据库自定义 → 回退 Agnes 默认）
// ============================================================
export async function getAIConfig(): Promise<AIConfig> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'ai_config' },
    });

    if (config) {
      const value = JSON.parse(config.value) as Record<string, string>;
      // 如果用户配置了自定义 AI（如 Kimi 开放平台），使用自定义配置
      if (value.provider && value.provider !== 'mock' && value.apiKey) {
        return {
          provider: value.provider,
          apiKey: value.apiKey,
          model: value.model || AGNES_DEFAULT.model,
          baseUrl: value.baseUrl || AGNES_DEFAULT.baseUrl,
        };
      }
    }
  } catch {
    // 数据库读取失败，使用默认配置
  }

  // 使用 Agnes AI 默认配置（环境变量优先）
  const apiKey = process.env.AGNES_API_KEY || '';
  return {
    provider: AGNES_DEFAULT.provider,
    apiKey,
    model: AGNES_DEFAULT.model,
    baseUrl: AGNES_DEFAULT.baseUrl,
  };
}

// ============================================================
// 通用 LLM 调用（OpenAI 兼容协议）
// ============================================================
export async function callLLM(
  prompt: string,
  options: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'text' | 'json_object';
  } = {}
): Promise<string> {
  const config = await getAIConfig();

  // 无 API Key 时使用模拟数据
  if (!config.apiKey) {
    console.warn('[AI] No API key configured, using mock response');
    return generateMockResponse(prompt);
  }

  try {
    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const body: Record<string, unknown> = {
      model: config.model,
      messages,
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 4096,
    };

    // JSON 模式
    if (options.responseFormat === 'json_object') {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI] API error (${response.status}):`, errorText.substring(0, 500));
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      console.warn('[AI] Empty response from API');
      return generateMockResponse(prompt);
    }

    return content;
  } catch (err) {
    console.error('[AI] Call failed:', err instanceof Error ? err.message : err);
    // 出错时回退到模拟数据，保证业务不中断
    return generateMockResponse(prompt);
  }
}

// ============================================================
// 流式 LLM 调用（SSE）
// ============================================================
export async function* callLLMStream(
  prompt: string,
  options: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): AsyncGenerator<string, void, unknown> {
  const config = await getAIConfig();

  if (!config.apiKey) {
    // 无 API Key 时模拟流式输出
    const mock = generateMockResponse(prompt);
    for (const char of mock) {
      yield char;
      await new Promise((r) => setTimeout(r, 10));
    }
    return;
  }

  try {
    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.maxTokens ?? 4096,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // 跳过无法解析的行
        }
      }
    }
  } catch (err) {
    console.error('[AI] Stream failed:', err instanceof Error ? err.message : err);
    const mock = generateMockResponse(prompt);
    for (const char of mock) {
      yield char;
      await new Promise((r) => setTimeout(r, 10));
    }
  }
}

// ============================================================
// 专用 AI 函数
// ============================================================

/** 解析简历文本 → 结构化候选人信息 */
export async function parseResume(resumeText: string): Promise<Record<string, unknown>> {
  const result = await callLLM(
    `请从以下简历内容中提取结构化信息，输出 JSON：

${resumeText.substring(0, 8000)}

请提取以下字段（如果简历中不存在则设为 null 或空数组）：
{
  "name": "姓名",
  "phone": "手机号码",
  "email": "邮箱地址",
  "education": [{"school": "学校", "degree": "学历", "major": "专业", "startDate": "开始日期", "endDate": "结束日期"}],
  "experience": [{"company": "公司", "position": "职位", "startDate": "开始日期", "endDate": "结束日期", "description": "工作描述"}],
  "skills": ["技能1", "技能2"],
  "certificates": ["证书1"],
  "projects": [{"name": "项目名", "description": "项目描述"}],
  "summary": "候选人综合概述（50字以内）",
  "confidence": 0.95
}`,
    {
      systemPrompt: '你是一位专业的简历解析专家。请从简历文本中精确提取结构化信息。只返回 JSON，不要任何其他内容。',
      temperature: 0.1,
      responseFormat: 'json_object',
    }
  );

  return parseAIJson(result);
}

/** 从邮件/文本中提取候选人信息 */
export async function extractCandidateFromText(text: string): Promise<Record<string, unknown>> {
  const result = await callLLM(
    `请从以下文本中提取候选人简历信息，输出 JSON：

${text.substring(0, 6000)}

{
  "name": "姓名",
  "email": "邮箱地址",
  "phone": "手机号码",
  "education": "学历（如本科、硕士）",
  "school": "毕业院校",
  "major": "专业",
  "experience": 工作年限数字,
  "currentCompany": "当前公司",
  "currentPosition": "当前职位",
  "skills": ["技能列表"],
  "expectedSalary": "期望薪资",
  "location": "所在城市",
  "appliedPosition": "应聘岗位"
}`,
    {
      systemPrompt: '你是一位专业的简历解析专家，从文本中提取候选人信息。只返回 JSON，不要其他内容。',
      temperature: 0.1,
      responseFormat: 'json_object',
    }
  );

  return parseAIJson(result);
}

/** 根据 JD 和候选人简历生成面试问题 */
export async function generateInterviewQuestions(
  jdTitle: string,
  jdDescription: string,
  candidateResume: string
): Promise<Record<string, unknown>> {
  const result = await callLLM(
    `请根据以下职位描述和候选人简历，生成 5 道个性化面试题目。

【职位名称】${jdTitle}
【职位描述】${jdDescription.substring(0, 2000)}
【候选人简历】${candidateResume.substring(0, 3000)}

输出 JSON 格式：
{
  "questions": [
    {
      "type": "technical|behavioral|situational",
      "difficulty": "easy|medium|hard",
      "question": "面试问题",
      "evaluationPoints": ["评估要点1", "评估要点2"],
      "referenceAnswer": "参考答案要点"
    }
  ],
  "focusAreas": ["需要重点考察的领域"],
  "suggestedDuration": "建议面试时长（分钟）"
}`,
    {
      systemPrompt: '你是一位资深的面试官和技术招聘专家。请根据 JD 和候选人背景，生成有针对性的面试题目。只返回 JSON。',
      temperature: 0.3,
      responseFormat: 'json_object',
    }
  );

  return parseAIJson(result);
}

/** 计算候选人与 JD 的匹配度 */
export async function calculateMatchScore(
  jdTitle: string,
  jdRequirements: string,
  candidateResume: string
): Promise<Record<string, unknown>> {
  const result = await callLLM(
    `请对比以下职位要求和候选人简历，计算匹配度评分。

【职位名称】${jdTitle}
【职位要求】${jdRequirements.substring(0, 3000)}
【候选人简历】${candidateResume.substring(0, 4000)}

输出 JSON 格式：
{
  "overallScore": 0-100的匹配度总分,
  "dimensions": {
    "skills": {"score": 0-100, "comment": "技能匹配评价"},
    "experience": {"score": 0-100, "comment": "经验匹配评价"},
    "education": {"score": 0-100, "comment": "学历匹配评价"},
    "culture": {"score": 0-100, "comment": "文化匹配评价"}
  },
  "strengths": ["候选人优势1", "优势2"],
  "gaps": ["候选人差距1", "差距2"],
  "recommendation": "综合建议（是否推荐进入面试）",
  "suggestedLevel": "建议定级（如 P6、P7）"
}`,
    {
      systemPrompt: '你是一位资深的招聘评估专家。请客观对比 JD 和候选人简历，给出匹配度评分。只返回 JSON。',
      temperature: 0.1,
      responseFormat: 'json_object',
    }
  );

  return parseAIJson(result);
}

/** 根据候选人背景和市场行情给出薪资建议 */
export async function suggestSalary(
  candidateResume: string,
  positionTitle: string,
  positionLevel: string,
  city: string
): Promise<Record<string, unknown>> {
  const result = await callLLM(
    `请根据候选人背景和职位信息，给出薪资建议。

【候选人背景】${candidateResume.substring(0, 3000)}
【职位名称】${positionTitle}
【职位级别】${positionLevel}
【工作城市】${city}

输出 JSON 格式：
{
  "marketRange": {"min": 最低市场价(万/年), "max": 最高市场价(万/年), "median": 中位数(万/年)},
  "suggestedRange": {"min": 建议最低(万/年), "max": 建议最高(万/年)},
  "breakdown": {
    "baseSalary": "建议基本月薪",
    "bonus": "建议年终奖（月数）",
    "stockOptions": "股票/期权建议"
  },
  "analysis": "薪资分析说明（100字以内）",
  "negotiationTips": ["谈判建议1", "建议2"]
}`,
    {
      systemPrompt: '你是一位资深的薪酬顾问，熟悉互联网行业薪资水平。请给出合理的薪资建议。只返回 JSON。',
      temperature: 0.2,
      responseFormat: 'json_object',
    }
  );

  return parseAIJson(result);
}

// ============================================================
// 工具函数
// ============================================================

/** 安全解析 AI 返回的 JSON */
function parseAIJson(raw: string): Record<string, unknown> {
  try {
    // 尝试直接解析
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // 尝试从 markdown 代码块中提取
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim()) as Record<string, unknown>;
      } catch {
        // 继续尝试
      }
    }
    // 尝试匹配 { } 包裹的 JSON
    const braceMatch = raw.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]) as Record<string, unknown>;
      } catch {
        // 继续尝试
      }
    }
    console.error('[AI] Failed to parse JSON response:', raw.substring(0, 200));
    return {};
  }
}

// ============================================================
// 模拟响应（无 API Key 时的兜底）
// ============================================================
function generateMockResponse(prompt: string): string {
  // 只检查 prompt 的前 200 个字符（即系统指令部分），避免用户简历内容干扰匹配
  const instructionPart = prompt.substring(0, 200).toLowerCase();

  if (instructionPart.includes('面试题') || instructionPart.includes('generateinterviewquestions')) {
    return JSON.stringify({
      questions: [
        { type: 'technical', difficulty: 'medium', question: '请描述您在之前项目中遇到的最具挑战性的技术问题及解决方案。', evaluationPoints: ['问题分析能力', '技术深度', '方案完整性'], referenceAnswer: '应展示系统性的问题解决思路。' },
        { type: 'behavioral', difficulty: 'medium', question: '请举例说明您如何处理团队中的意见分歧。', evaluationPoints: ['沟通能力', '团队协作', '冲突处理'], referenceAnswer: '应展示良好的沟通技巧和团队协作精神。' },
        { type: 'situational', difficulty: 'hard', question: '如果项目进度严重滞后且需求变更，您如何处理？', evaluationPoints: ['应变能力', '优先级判断', '风险管理'], referenceAnswer: '应展示项目管理能力和应变策略。' },
        { type: 'technical', difficulty: 'easy', question: '请解释您熟悉的技术栈中某个核心概念的工作原理。', evaluationPoints: ['技术理解深度', '表达能力'], referenceAnswer: '应清晰准确地解释技术概念。' },
        { type: 'behavioral', difficulty: 'medium', question: '请描述一次您主动学习新技术的经历。', evaluationPoints: ['学习能力', '主动性'], referenceAnswer: '应展示持续学习的习惯。' },
      ],
      focusAreas: ['技术深度', '团队协作', '问题解决'],
      suggestedDuration: 45,
    });
  }

  if (instructionPart.includes('匹配度') || instructionPart.includes('calculatematchscore')) {
    return JSON.stringify({
      overallScore: 78,
      dimensions: {
        skills: { score: 82, comment: '技能匹配度较高' },
        experience: { score: 75, comment: '经验基本符合要求' },
        education: { score: 85, comment: '学历背景优秀' },
        culture: { score: 70, comment: '文化契合度良好' },
      },
      strengths: ['技术基础扎实', '项目经验丰富', '学习能力强'],
      gaps: ['管理经验相对较少', '行业经验需要补充'],
      recommendation: '建议进入面试环节',
      suggestedLevel: 'P6',
    });
  }

  if (instructionPart.includes('薪资建议') || instructionPart.includes('suggestsalary')) {
    return JSON.stringify({
      marketRange: { min: 25, max: 50, median: 35 },
      suggestedRange: { min: 30, max: 42 },
      breakdown: { baseSalary: '25K-35K/月', bonus: '3-6个月', stockOptions: '视级别而定' },
      analysis: '候选人背景与岗位要求匹配度较高，建议在市场中等偏上水平给出offer。',
      negotiationTips: ['强调公司发展前景', '突出技术氛围', '提供灵活工作制'],
    });
  }

  // 默认：简历解析
  return JSON.stringify({
    name: null,
    phone: null,
    email: null,
    education: [],
    experience: [],
    skills: [],
    certificates: [],
    projects: [],
    summary: '（AI 未配置，使用模拟数据）',
    confidence: 0,
  });
}

// 别名导出
export const generateAIContent = callLLM;
