import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// POST /api/interviews/[id]/feedback - 提交面试反馈
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) return error(401, '未登录');
    const { id } = await params;
    const body = await request.json();

    const {
      round = 1,
      technicalScore,
      communicationScore,
      problemSolvingScore,
      teamworkScore,
      cultureScore,
      overallScore,
      strengths,
      weaknesses,
      concerns,
      recommendation,
      comments,
    } = body;

    // Check interview exists
    const interview = await prisma.interview.findUnique({ where: { id } });
    if (!interview) return error(404, '面试不存在');

    const feedback = await prisma.interviewFeedback.upsert({
      where: {
        interviewId_evaluatorId_round: {
          interviewId: id,
          evaluatorId: auth.userId,
          round,
        },
      },
      update: {
        technicalScore,
        communicationScore,
        problemSolvingScore,
        teamworkScore,
        cultureScore,
        overallScore,
        strengths,
        weaknesses,
        concerns,
        recommendation,
        comments,
        submittedAt: new Date(),
      },
      create: {
        interviewId: id,
        evaluatorId: auth.userId,
        round,
        technicalScore,
        communicationScore,
        problemSolvingScore,
        teamworkScore,
        cultureScore,
        overallScore,
        strengths,
        weaknesses,
        concerns,
        recommendation,
        comments,
        submittedAt: new Date(),
      },
    });

    return success(feedback);
  } catch (e) {
    console.error('Submit feedback error:', e);
    return error(500, '提交面试反馈失败');
  }
}
