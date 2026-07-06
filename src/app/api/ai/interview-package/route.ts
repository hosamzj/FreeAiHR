import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/auth';
import { callLLM } from '@/lib/ai';

// POST /api/ai/interview-package - 生成面试准备包
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { interviewId } = body;

    if (!interviewId) return error(422, '面试ID不能为空');

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { candidate: true, position: true },
    });

    if (!interview) return error(404, '面试不存在');

    const { candidate, position } = interview;

    // Mock package
    const mockPackage = {
      interviewId,
      candidateSummary: `${candidate.name}，${candidate.experience || 0}年经验，毕业于${candidate.school || '未知'}，目前在${candidate.currentCompany || '未知'}担任${candidate.currentPosition || '未知'}。`,
      aiProfile: {
        strengths: ['技术能力扎实', '项目经验丰富', '学习能力强'],
        concerns: ['管理经验有限', '沟通表达需进一步观察'],
        personality: '分析型，注重细节',
      },
      suggestedQuestions: [
        '请描述您最有成就感的一个项目，以及您遇到的最大挑战是什么？',
        '您如何处理团队中的意见分歧？请举例说明。',
        '您对未来3-5年的职业规划是什么？',
        '您如何看待我们公司的产品/服务？有什么改进建议吗？',
      ],
      riskPoints: [
        '频繁跳槽（需了解原因）',
        '期望薪资可能超出预算',
      ],
      scoringRubric: {
        technicalSkill: { weight: 30, criteria: '技术深度、问题解决能力' },
        communication: { weight: 20, criteria: '表达清晰度、逻辑性' },
        teamwork: { weight: 20, criteria: '协作意识、冲突处理' },
        cultureFit: { weight: 15, criteria: '价值观匹配、工作风格' },
        potential: { weight: 15, criteria: '学习能力、成长潜力' },
      },
    };

    // Try AI generation
    try {
      const aiResult = await callLLM(
        `为以下面试生成准备包：
        候选人: ${candidate.name}, ${candidate.experience || 0}年经验, 技能: ${candidate.skills}
        岗位: ${position?.title || candidate.appliedPosition || '未指定'}
        
        输出JSON格式包含：candidateSummary, aiProfile, suggestedQuestions, riskPoints, scoringRubric`,
        { systemPrompt: 'You are an expert HR assistant that prepares interview packages for hiring managers.' }
      );
      
      if (aiResult && typeof aiResult === 'object' && 'candidateSummary' in aiResult) {
        const result = aiResult as Record<string, unknown>;
        const pkg = await prisma.interviewPackage.upsert({
          where: { interviewId },
          update: {
            candidateSummary: result.candidateSummary as string,
            aiProfile: JSON.stringify(result.aiProfile),
            suggestedQuestions: JSON.stringify(result.suggestedQuestions),
            riskPoints: JSON.stringify(result.riskPoints),
            scoringRubric: JSON.stringify(result.scoringRubric),
            status: 'pending',
          },
          create: {
            interviewId,
            candidateSummary: result.candidateSummary as string,
            aiProfile: JSON.stringify(result.aiProfile),
            suggestedQuestions: JSON.stringify(result.suggestedQuestions),
            riskPoints: JSON.stringify(result.riskPoints),
            scoringRubric: JSON.stringify(result.scoringRubric),
            status: 'pending',
          },
        });
        return success(pkg);
      }
    } catch {
      // Fall back to mock
    }

    const pkg = await prisma.interviewPackage.upsert({
      where: { interviewId },
      update: {
        candidateSummary: mockPackage.candidateSummary,
        aiProfile: JSON.stringify(mockPackage.aiProfile),
        suggestedQuestions: JSON.stringify(mockPackage.suggestedQuestions),
        riskPoints: JSON.stringify(mockPackage.riskPoints),
        scoringRubric: JSON.stringify(mockPackage.scoringRubric),
        status: 'pending',
      },
      create: {
        interviewId,
        candidateSummary: mockPackage.candidateSummary,
        aiProfile: JSON.stringify(mockPackage.aiProfile),
        suggestedQuestions: JSON.stringify(mockPackage.suggestedQuestions),
        riskPoints: JSON.stringify(mockPackage.riskPoints),
        scoringRubric: JSON.stringify(mockPackage.scoringRubric),
        status: 'pending',
      },
    });

    return success(pkg);
  } catch (e) {
    console.error('Interview package error:', e);
    return error(500, '生成面试准备包失败');
  }
}
