import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';
import { generateAIContent } from '@/lib/ai';

// POST - 生成面试题目
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { candidateId, positionName, difficulty, count = 8 } = body;

    if (!positionName) {
      return error(422, '请提供职位名称');
    }

    let candidateInfo = '';
    if (candidateId) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
      });
      if (candidate) {
        candidateInfo = `
候选人信息：
- 姓名：${candidate.name}
- 学历：${candidate.education || '未知'}
- 工作年限：${candidate.experience || 0}年
- 当前职位：${candidate.currentPosition || '未知'}
- 技能：${candidate.skills || '[]'}
`;
      }
    }

    const difficultyMap: Record<string, string> = {
      junior: '初级（适合1-3年经验）',
      mid: '中级（适合3-5年经验）',
      senior: '高级（适合5年以上经验）',
    };

    const prompt = `请为以下职位生成面试题目：

职位名称：${positionName}
难度级别：${difficultyMap[difficulty] || '中级'}
${candidateInfo}
题目数量：${count}道

请生成以下类型的题目：
1. 技术题（3-4道）：考察专业技能
2. 行为面试题（2-3道）：考察过往经历和行为模式
3. 情景题（2-3道）：考察应变能力和解决问题的思路

请用JSON格式返回：
{
  "questions": [
    {
      "type": "technical|behavioral|situational",
      "question": "题目内容",
      "expectedAnswer": "期望回答要点",
      "followUp": "追问建议"
    }
  ]
}`;

    const result = await generateAIContent(prompt);
    
    // 尝试解析JSON
    let questionsData;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      // 返回模拟数据
      questionsData = {
        questions: [
          {
            type: 'technical',
            question: `请介绍一下您在${positionName}领域最熟悉的技术栈和工具？`,
            expectedAnswer: '候选人应能清晰描述其技术栈，包括主要语言、框架、工具等',
            followUp: '您在这个技术栈中遇到的最大挑战是什么？如何解决的？',
          },
          {
            type: 'technical',
            question: `请描述一个您主导或深度参与的${positionName}相关项目，您的具体贡献是什么？`,
            expectedAnswer: '候选人应能详细描述项目背景、自己的角色和具体贡献',
            followUp: '如果重新做这个项目，您会有什么不同的做法？',
          },
          {
            type: 'behavioral',
            question: '请分享一个您与团队成员意见不一致的经历，您是如何处理的？',
            expectedAnswer: '考察沟通能力和冲突解决能力',
            followUp: '最终的结果如何？您从中学到了什么？',
          },
          {
            type: 'behavioral',
            question: '请描述一次您在紧迫的deadline下完成任务的经历。',
            expectedAnswer: '考察时间管理和压力应对能力',
            followUp: '您是如何保证质量的？',
          },
          {
            type: 'situational',
            question: `如果入职后发现${positionName}的工作内容与您的预期有较大差异，您会怎么做？`,
            expectedAnswer: '考察适应能力和职业态度',
            followUp: '您理想的工作内容是什么样的？',
          },
          {
            type: 'situational',
            question: '如果您的需求与产品经理的需求产生冲突，您会如何协调？',
            expectedAnswer: '考察协作和沟通能力',
            followUp: '能否举一个实际例子？',
          },
        ],
      };
    }

    return success({
      positionName,
      difficulty: difficulty || 'mid',
      candidateId,
      ...questionsData,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Generate interview questions error:', err);
    return error(500, '生成面试题目失败', 500);
  }
}
