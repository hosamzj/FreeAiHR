import { prisma } from '@/lib/prisma';

interface AIConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
}

// 获取AI配置
export async function getAIConfig(): Promise<AIConfig> {
  const config = await prisma.systemConfig.findUnique({
    where: { key: 'ai_config' },
  });

  if (!config) {
    return {
      provider: 'mock',
      apiKey: '',
      model: '',
      baseUrl: '',
    };
  }

  try {
    const value = JSON.parse(config.value) as Record<string, string>;
    return {
      provider: value.provider || 'mock',
      apiKey: value.apiKey || '',
      model: value.model || '',
      baseUrl: value.baseUrl || '',
    };
  } catch {
    return {
      provider: 'mock',
      apiKey: '',
      model: '',
      baseUrl: '',
    };
  }
}

// 调用LLM API
export async function callLLM(
  prompt: string,
  options: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const config = await getAIConfig();

  // 模拟模式 - 返回mock数据
  if (config.provider === 'mock' || !config.apiKey) {
    return generateMockResponse(prompt);
  }

  // 实际调用LLM API
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error:', errorText);
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error('Call LLM error:', err);
    // 出错时返回mock数据
    return generateMockResponse(prompt);
  }
}

// 生成模拟响应
function generateMockResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  // JD生成
  if (lowerPrompt.includes('职位描述') || lowerPrompt.includes('jd') || lowerPrompt.includes('岗位')) {
    return JSON.stringify({
      jobTitle: extractFromPrompt(prompt, '岗位名称') || '软件工程师',
      responsibilities: [
        '负责公司核心产品的开发与维护',
        '参与系统架构设计和技术方案评审',
        '编写高质量、可维护的代码',
        '与产品、设计团队紧密合作，推动产品迭代',
        '持续优化系统性能，提升用户体验',
      ],
      requirements: [
        '本科及以上学历，计算机相关专业优先',
        '3年以上相关开发经验',
        '熟练掌握至少一种主流编程语言',
        '良好的编码习惯和文档编写能力',
        '具备较强的学习能力和团队协作精神',
      ],
      preferred: [
        '有大型项目经验优先',
        '熟悉敏捷开发流程优先',
        '有开源项目贡献经验优先',
      ],
      benefits: [
        '具有竞争力的薪酬待遇',
        '完善的五险一金',
        '弹性工作制',
        '年度体检',
        '丰富的团建活动',
      ],
    });
  }

  // 候选人画像
  if (lowerPrompt.includes('候选人') || lowerPrompt.includes('画像') || lowerPrompt.includes('简历')) {
    return JSON.stringify({
      radarScores: {
        technical: 75 + Math.floor(Math.random() * 20),
        communication: 70 + Math.floor(Math.random() * 25),
        leadership: 60 + Math.floor(Math.random() * 30),
        innovation: 65 + Math.floor(Math.random() * 30),
        execution: 75 + Math.floor(Math.random() * 20),
        learning: 80 + Math.floor(Math.random() * 15),
      },
      personality: {
        type: ['完美型', '成就型', '助人型', '自我型', '理智型', '忠诚型', '活跃型', '领袖型', '和平型'][Math.floor(Math.random() * 9)],
        description: '该候选人展现出较强的专业能力和团队协作精神，在工作中注重细节，追求高质量交付。',
      },
      overallScore: 75 + Math.floor(Math.random() * 20),
      matchAnalysis: {
        matchPercentage: 70 + Math.floor(Math.random() * 25),
        strengths: ['技术基础扎实', '项目经验丰富', '学习能力强'],
        concerns: ['管理经验相对较少', '行业经验需要补充'],
      },
      summary: '综合评估该候选人具备较强的专业能力和发展潜力，建议进入下一轮面试。',
    });
  }

  // 面试题目生成
  if (lowerPrompt.includes('面试题') || lowerPrompt.includes('题目')) {
    return JSON.stringify({
      questions: [
        {
          type: 'technical',
          difficulty: 'medium',
          question: '请描述一下您在之前项目中遇到的最具挑战性的技术问题，以及您是如何解决的？',
          evaluationPoints: ['问题分析能力', '解决方案的完整性', '技术深度'],
          referenceAnswer: '候选人应展示系统性的问题解决思路，包括问题定位、方案设计、实施过程和结果验证。',
        },
        {
          type: 'behavioral',
          difficulty: 'medium',
          question: '请举例说明您如何在团队中处理意见分歧的情况？',
          evaluationPoints: ['沟通能力', '团队协作', '冲突处理'],
          referenceAnswer: '候选人应展示良好的沟通技巧和团队协作精神，能够通过理性讨论达成共识。',
        },
        {
          type: 'situational',
          difficulty: 'hard',
          question: '如果项目进度严重滞后，而客户需求又发生变更，您会如何处理？',
          evaluationPoints: ['应变能力', '优先级判断', '风险管理'],
          referenceAnswer: '候选人应展示良好的项目管理能力和应变策略，能够平衡多方需求。',
        },
        {
          type: 'technical',
          difficulty: 'easy',
          question: '请解释一下您熟悉的技术栈中，某个核心概念的工作原理。',
          evaluationPoints: ['技术理解深度', '表达能力'],
          referenceAnswer: '候选人应能够清晰、准确地解释技术概念，展示扎实的技术基础。',
        },
        {
          type: 'behavioral',
          difficulty: 'medium',
          question: '请描述一次您主动学习新技术或新知识的经历。',
          evaluationPoints: ['学习能力', '主动性', '自我驱动'],
          referenceAnswer: '候选人应展示持续学习的习惯和自我提升的意识。',
        },
      ],
    });
  }

  // 简历解析
  if (lowerPrompt.includes('解析') || lowerPrompt.includes('提取')) {
    return JSON.stringify({
      name: '张三',
      phone: '13800138000',
      email: 'zhangsan@example.com',
      education: [
        {
          school: '北京大学',
          degree: '本科',
          major: '计算机科学',
          startDate: '2015-09',
          endDate: '2019-06',
        },
      ],
      workExperience: [
        {
          company: '某科技公司',
          position: '软件工程师',
          startDate: '2019-07',
          endDate: '至今',
          description: '负责核心业务系统的开发与维护',
        },
      ],
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
      summary: '5年软件开发经验，熟悉前后端开发技术栈。',
    });
  }

  // 默认响应
  return JSON.stringify({ message: 'AI功能演示模式', data: {} });
}

// 从提示词中提取信息
function extractFromPrompt(prompt: string, key: string): string {
  const regex = new RegExp(`${key}[：:]\\s*([^\\n,，]+)`);
  const match = prompt.match(regex);
  return match ? match[1].trim() : '';
}

// 别名导出 - 供API路由使用
export const generateAIContent = callLLM;
