import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// GET /api/interviews/[id]/package - 获取面试准备包
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const pkg = await prisma.interviewPackage.findUnique({
      where: { interviewId: id },
    });

    if (!pkg) {
      return success(null, '面试准备包尚未生成');
    }

    return success({
      ...pkg,
      aiProfile: pkg.aiProfile ? JSON.parse(pkg.aiProfile) : null,
      suggestedQuestions: pkg.suggestedQuestions ? JSON.parse(pkg.suggestedQuestions) : [],
      riskPoints: pkg.riskPoints ? JSON.parse(pkg.riskPoints) : [],
      scoringRubric: pkg.scoringRubric ? JSON.parse(pkg.scoringRubric) : null,
    });
  } catch (e) {
    console.error('Get interview package error:', e);
    return error(500, '获取面试准备包失败');
  }
}
