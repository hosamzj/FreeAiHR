import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// GET /api/interviews/[id]/feedback-summary - 获取面试反馈汇总
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const feedbacks = await prisma.interviewFeedback.findMany({
      where: { interviewId: id },
      orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
    });

    if (feedbacks.length === 0) {
      return success({ feedbacks: [], summary: null });
    }

    // Calculate averages
    const avgScores = {
      technical: feedbacks.reduce((sum, f) => sum + (f.technicalScore || 0), 0) / feedbacks.length,
      communication: feedbacks.reduce((sum, f) => sum + (f.communicationScore || 0), 0) / feedbacks.length,
      problemSolving: feedbacks.reduce((sum, f) => sum + (f.problemSolvingScore || 0), 0) / feedbacks.length,
      teamwork: feedbacks.reduce((sum, f) => sum + (f.teamworkScore || 0), 0) / feedbacks.length,
      culture: feedbacks.reduce((sum, f) => sum + (f.cultureScore || 0), 0) / feedbacks.length,
      overall: feedbacks.reduce((sum, f) => sum + (f.overallScore || 0), 0) / feedbacks.length,
    };

    // Count recommendations
    const recommendations = feedbacks.reduce((acc, f) => {
      if (f.recommendation) acc[f.recommendation] = (acc[f.recommendation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return success({
      feedbacks,
      summary: {
        totalFeedbacks: feedbacks.length,
        avgScores,
        recommendations,
        consensusRecommendation: Object.entries(recommendations).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      },
    });
  } catch (e) {
    console.error('Get feedback summary error:', e);
    return error(500, '获取面试反馈汇总失败');
  }
}
