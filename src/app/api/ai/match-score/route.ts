import { NextRequest } from 'next/server';
import { success, error, requireAuth } from '@/lib/auth';
import { calculateMatchScore } from '@/lib/ai';

// POST /api/ai/match-score - AI 计算候选人与 JD 匹配度
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) return error(401, '请先登录');

    const body = await request.json();
    const { jdTitle, jdRequirements, candidateResume } = body;

    if (!jdTitle || !jdRequirements) {
      return error(422, '请提供职位名称和职位要求');
    }

    if (!candidateResume) {
      return error(422, '请提供候选人简历');
    }

    const result = await calculateMatchScore(jdTitle, jdRequirements, candidateResume);

    return success(result);
  } catch (e) {
    console.error('Calculate match score error:', e);
    return error(500, '匹配度计算失败');
  }
}
