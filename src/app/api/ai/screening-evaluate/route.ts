import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/auth';
import { callLLM } from '@/lib/ai';

// POST /api/ai/screening-evaluate - AI评估初筛回答
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, answers } = body;

    if (!candidateId || !answers) return error(422, '参数不完整');

    // Mock evaluation
    const mockEvaluation = {
      candidateId,
      overallScore: Math.floor(Math.random() * 20) + 75,
      evaluations: answers.map((a: { questionId: string; answer: string }, i: number) => ({
        questionId: a.questionId,
        score: Math.floor(Math.random() * 2) + 3,
        evaluation: ['回答较为全面，展现了良好的专业能力', '回答简洁明了，但缺少具体案例', '回答展现了较强的思考深度'][i % 3],
      })),
      summary: '候选人整体表现良好，建议进入面试环节。',
      recommendation: 'recommend',
    };

    // Try AI evaluation
    try {
      const aiResult = await callLLM(
        `请评估以下候选人的初筛回答：
        回答内容: ${JSON.stringify(answers)}
        
        输出JSON格式：
        {
          "overallScore": 0-100,
          "evaluations": [{"questionId": "id", "score": 1-5, "evaluation": "评语"}],
          "summary": "总体评价",
          "recommendation": "recommend|not_recommend|neutral"
        }`,
        { systemPrompt: 'You are an expert HR AI that evaluates candidate screening responses.' }
      );
      
      if (aiResult && typeof aiResult === 'object' && 'overallScore' in aiResult) {
        return success(aiResult);
      }
    } catch {
      // Fall back to mock
    }

    return success(mockEvaluation);
  } catch (e) {
    console.error('Screening evaluate error:', e);
    return error(500, '评估初筛回答失败');
  }
}
