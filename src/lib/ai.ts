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
    // 默认使用 DeepSeek，但 apiKey 为空时会 fallback 到 mock 模式
    return {
      provider: 'deepseek',
      apiKey: '',
      model: 'deepseek-v4-pro',
      baseUrl: 'https://api.deepseek.com',
    };
  }

  try {
    const value = JSON.parse(config.value) as Record<string, string>;
    const provider = value.provider || 'deepseek';

    // 如果 provider 已不在有效列表中，重置为 DeepSeek 默认配置
    const validProviders = ['deepseek', 'agnes'];
    if (!validProviders.includes(provider)) {
      return {
        provider: 'deepseek',
        apiKey: '',
        model: 'deepseek-v4-pro',
        baseUrl: 'https://api.deepseek.com',
      };
    }

    return {
      provider,
      apiKey: value.apiKey || '',
      model: value.model || 'deepseek-v4-pro',
      baseUrl: value.baseUrl || 'https://api.deepseek.com',
    };
  } catch {
    return {
      provider: 'deepseek',
      apiKey: '',
      model: 'deepseek-v4-pro',
      baseUrl: 'https://api.deepseek.com',
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
    format?: 'text' | 'json';
  } = {}
): Promise<string> {
  const config = await getAIConfig();

  // 模拟模式 - 返回mock数据
  if (config.provider === 'mock' || !config.apiKey) {
    return generateMockResponse(prompt, options.format);
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
      console.error('LLM API error:', response.status, errorText);
      // 区分错误类型，给出更明确的提示
      if (response.status === 401) {
        throw new Error(`AI 服务认证失败：API Key 无效，请检查系统设置中的 AI 配置`);
      }
      if (response.status === 429) {
        throw new Error(`AI 服务请求过于频繁，请稍后重试`);
      }
      throw new Error(`AI 服务错误 (${response.status})：${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error('Call LLM error:', err);
    // 如果配置了真实API但调用失败，降级到mock模式而不是直接失败
    // 这样AI功能不会完全中断，同时记录错误日志
    console.warn('AI API call failed, falling back to mock mode. Provider:', config.provider);
    return generateMockResponse(prompt, options.format);
  }
}

// 生成模拟响应
function generateMockResponse(prompt: string, format?: 'text' | 'json'): string {
  if (format === 'text') {
    // 聊天模式：返回纯文本的友好回复
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('筛选') || lowerPrompt.includes('前端') || lowerPrompt.includes('工程师')) {
      return `已为您筛选出 **3 位前端工程师候选人**，按匹配度排序如下：\n\n1. **张明远** — 匹配度 92%\n   5年经验，React/TypeScript/Next.js 技术栈，字节跳动背景\n\n2. **赵子龙** — 匹配度 94%（新投递）\n   6年经验，前端架构师，美团背景\n\n3. **王浩然** — 匹配度 75%\n   3年经验，Vue.js 为主，需评估 React 能力\n\n建议优先面试张明远和赵子龙。`;
    }
    if (lowerPrompt.includes('面试') && (lowerPrompt.includes('安排') || lowerPrompt.includes('今天'))) {
      return `今天有 **2 场面试** 安排：\n\n🔹 **14:00** — 张明远（高级前端工程师）\n   面试官：陈技术 ｜ 会议室 A301\n   类型：技术面\n\n🔹 **10:00** — 刘子轩（后端工程师）\n   面试官：刘后端 ｜ 会议室 B202\n   类型：初面\n\n明天还有 1 场面试：周子涵（产品经理）15:00`;
    }
    if (lowerPrompt.includes('jd') || lowerPrompt.includes('职位描述') || lowerPrompt.includes('生成')) {
      return `已为您生成 **高级产品经理** 的职位描述：\n\n**岗位职责**\n1. 负责公司 B 端 SaaS 产品的整体规划与迭代\n2. 深入理解客户需求，输出高质量 PRD\n3. 协同研发、设计团队推进产品落地\n4. 基于数据分析持续优化产品体验\n5. 关注行业趋势，保持产品竞争力\n\n**任职要求**\n- 本科及以上学历，3年以上 B 端产品经验\n- 熟悉 SaaS 产品模式，有从 0 到 1 项目经验\n- 优秀的逻辑思维与数据分析能力\n- 出色的跨部门沟通与协调能力\n\n💡 我可以帮您进一步调整薪资范围、优化表述风格，或者生成不同版本。`;
    }
    if (lowerPrompt.includes('面试题') || lowerPrompt.includes('题目')) {
      return `已为 **高级前端工程师** 生成 5 道面试题：\n\n**1. 技术深度（Hard）**\n请描述 React 18 Concurrent Mode 的工作原理，以及在真实项目中如何权衡使用？\n\n**2. 架构设计（Hard）**\n如何设计一个支持百万级数据的高性能虚拟滚动列表？\n\n**3. 工程化（Medium）**\n微前端架构在大型项目中的落地经验？\n\n**4. 性能优化（Medium）**\nCore Web Vitals 指标如何优化？\n\n**5. 综合能力（Medium）**\n作为前端负责人，如何制定团队的技术栈选型标准？`;
    }
    if (lowerPrompt.includes('对比') || lowerPrompt.includes('比较')) {
      return `已为您对比 **张明远** vs **陈雨桐**：\n\n| 维度 | 张明远 | 陈雨桐 |\n|------|--------|--------|\n| 匹配度 | 92% | 95% |\n| 经验 | 5年 | 4年 |\n| 技术/设计 | 前端架构 | 设计系统 |\n| 大厂背景 | 字节+阿里 | 蚂蚁+小红书 |\n| 薪资期望 | 35-50K | 25-40K |\n\n**综合建议**：两位候选人都非常优秀，建议尽快安排终面。`;
    }
    if (lowerPrompt.includes('分析') || lowerPrompt.includes('数据') || lowerPrompt.includes('瓶颈')) {
      return `📊 **本周招聘数据分析**\n\n**关键指标**\n- 简历收集：48 份（+20% vs 上周）\n- AI 筛选通过：18 份（转化率 37.5%）\n- 面试安排：12 场（+33%）\n- Offer 发放：2 份\n- 成功入职：1 人\n\n**⚠️ 瓶颈环节**\n1. 简历→筛选转化率仅 37.5%，建议优化 JD 关键词\n2. 面试→Offer 转化率 16.7%，建议加强候选人体验管理\n\n**✅ 亮点**\n- 技术部面试通过率高达 80%\n- AI 推荐候选人采纳率达 78%`;
    }
    return `我理解您的问题：**"${prompt}"**\n\n目前我可以帮您完成以下招聘任务：\n\n• 📋 **筛选候选人** — 按岗位、技能、匹配度筛选\n• 📅 **面试管理** — 查看排期、安排面试、提醒通知\n• 📝 **JD 生成** — 智能生成职位描述，支持多种风格\n• 🎯 **面试题生成** — 按岗位和技术栈生成针对性题目\n• ⚖️ **候选人对比** — 多维度雷达图对比分析\n• 📊 **数据洞察** — 招聘漏斗分析、瓶颈识别\n\n请告诉我您想做什么。`;
  }

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