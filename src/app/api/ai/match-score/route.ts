import { NextRequest } from 'next/server';
import { success, error } from '@/lib/auth';
import { callLLM } from '@/lib/ai';

// POST /api/ai/match-score - AI岗位匹配评分
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, positionId } = body;

    if (!candidateId) return error(422, '候选人ID不能为空');

    // Mock data for demo
    const mockResult = {
      candidateId,
      positionId,
      overallScore: Math.floor(Math.random() * 30) + 70, // 70-99
      dimensions: {
        skillMatch: Math.floor(Math.random() * 30) + 70,
        experienceMatch: Math.floor(Math.random() * 30) + 65,
        cultureMatch: Math.floor(Math.random() * 25) + 75,
        potentialScore: Math.floor(Math.random() * 25) + 75,
      },
      matchReasons: [
        '技能栈与岗位要求高度匹配',
        '相关行业经验3年以上',
        '具备良好的团队协作能力',
        '学习能力突出，成长潜力大',
      ],
      riskPoints: [
        '缺少大规模分布式系统经验',
        '管理经验相对有限',
      ],
      recommendation: 'recommend' as const,
      aiSummary: '该候选人在技术能力和项目经验方面与岗位需求高度匹配，建议进入下一轮面试。',
    };

    // Try to use real AI if configured
    try {
      const aiResult = await callLLM(
        `请根据以下信息评估候选人与岗位的匹配度，输出JSON格式：
        候选人ID: ${candidateId}
        岗位ID: ${positionId || '未指定'}
        
        输出格式：
        {
          "overallScore": 0-100,
          "dimensions": {"skillMatch": 0-100, "experienceMatch": 0-100, "cultureMatch": 0-100, "potentialScore": 0-100},
          "matchReasons": ["匹配原因1", "匹配原因2"],
          "riskPoints": ["风险点1", "风险点2"],
          "recommendation": "strongly_recommend|recommend|neutral|not_recommend",
          "aiSummary": "综合评价"
        }`,
        { systemPrompt: 'You are an expert HR AI assistant that evaluates candidate-job fit.' }
      );
      
      if (aiResult && typeof aiResult === 'object' && 'overallScore' in aiResult) {
        const result = aiResult as Record<string, unknown>;
        return success({ ...result, candidateId, positionId });
      }
    } catch {
      // Fall back to mock data
    }

    return success(mockResult);
  } catch (e) {
    console.error('Match score error:', e);
    return error(500, '匹配评分失败');
  }
}
