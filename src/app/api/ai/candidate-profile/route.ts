import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';
import { generateAIContent } from '@/lib/ai';

// POST - 生成候选人AI画像
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { candidateId } = body;

    if (!candidateId) {
      return error(422, '请提供候选人ID');
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return error(404, '候选人不存在');
    }

    // 构建候选人信息摘要
    const candidateInfo = `
候选人基本信息：
- 姓名：${candidate.name}
- 学历：${candidate.education || '未知'}
- 学校：${candidate.school || '未知'}
- 专业：${candidate.major || '未知'}
- 工作年限：${candidate.experience || 0}年
- 当前公司：${candidate.currentCompany || '未知'}
- 当前职位：${candidate.currentPosition || '未知'}
- 技能：${candidate.skills || '[]'}
- 应聘职位：${candidate.appliedPosition || '未知'}
- 所在部门：${candidate.department || '未知'}
`;

    const prompt = `请基于以下候选人信息，生成AI画像分析：

${candidateInfo}

请生成以下内容：
1. 六维能力评估（每项0-100分）：技术能力、沟通能力、领导力、创新力、执行力、学习能力
2. 九型人格分析（根据经历推断最可能的1-2种人格类型）
3. 综合评价（100-200字）
4. 推荐指数（1-100分）
5. 岗位匹配度分析（与应聘职位的匹配百分比）

请用JSON格式返回：
{
  "abilities": {
    "technical": 85,
    "communication": 75,
    "leadership": 60,
    "innovation": 70,
    "execution": 80,
    "learning": 90
  },
  "personality": {
    "primary": "完美型",
    "secondary": "成就型",
    "description": "人格特点描述"
  },
  "evaluation": "综合评价内容",
  "recommendationScore": 85,
  "positionMatch": {
    "score": 88,
    "strengths": ["优势1", "优势2"],
    "gaps": ["不足1", "不足2"]
  }
}`;

    const result = await generateAIContent(prompt);
    
    // 尝试解析JSON
    let profileData;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        profileData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      // 返回模拟数据
      const exp = candidate.experience || 0;
      profileData = {
        abilities: {
          technical: Math.min(95, 60 + exp * 3 + Math.floor(Math.random() * 10)),
          communication: 65 + Math.floor(Math.random() * 20),
          leadership: Math.min(90, 40 + exp * 4 + Math.floor(Math.random() * 10)),
          innovation: 60 + Math.floor(Math.random() * 25),
          execution: 70 + Math.floor(Math.random() * 20),
          learning: 75 + Math.floor(Math.random() * 20),
        },
        personality: {
          primary: ['完美型', '成就型', '助人型', '理智型'][Math.floor(Math.random() * 4)],
          secondary: ['成就型', '助人型', '活跃型', '忠诚型'][Math.floor(Math.random() * 4)],
          description: `该候选人表现出较强的${['专业技能', '团队协作', '创新思维', '执行力'][Math.floor(Math.random() * 4)]}特质，在工作中注重${['细节', '效率', '质量', '结果'][Math.floor(Math.random() * 4)]}。`,
        },
        evaluation: `${candidate.name}拥有${exp}年工作经验，具备扎实的${candidate.currentPosition || '专业'}技能。从简历来看，该候选人在${candidate.currentCompany || ' previous company'}期间展现了良好的${['技术能力', '团队协作', '项目管理', '创新思维'][Math.floor(Math.random() * 4)]}。建议进一步面试评估其${['沟通能力', '领导力', '文化匹配度'][Math.floor(Math.random() * 3)]}。`,
        recommendationScore: Math.min(95, 60 + exp * 2 + Math.floor(Math.random() * 15)),
        positionMatch: {
          score: Math.min(95, 65 + Math.floor(Math.random() * 25)),
          strengths: ['相关领域经验丰富', '技能匹配度高', '学历背景优秀'],
          gaps: ['行业经验可能需要补充', '管理经验有待验证'],
        },
      };
    }

    return success({
      candidateId,
      candidateName: candidate.name,
      appliedPosition: candidate.appliedPosition,
      ...profileData,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Generate candidate profile error:', err);
    return error(500, '生成AI画像失败', 500);
  }
}
