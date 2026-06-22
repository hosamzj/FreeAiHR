import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, unauthorized, badRequest } from '@/lib/auth';

// GET /api/interviews/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireAuth();
  if (!user) return unauthorized();

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: {
      candidate: { select: { id: true, name: true, appliedPosition: true, email: true, phone: true } },
      interviewer: { select: { id: true, name: true, department: true } },
      evaluations: {
        include: { evaluator: { select: { name: true } } },
      },
    },
  });

  if (!interview) return badRequest('面试不存在');
  return success(interview);
}

// PUT /api/interviews/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.status) updateData.status = body.status;
    if (body.scheduledAt) updateData.scheduledAt = new Date(body.scheduledAt);
    if (body.duration) updateData.duration = body.duration;
    if (body.location) updateData.location = body.location;
    if (body.notes) updateData.notes = body.notes;

    const interview = await prisma.interview.update({
      where: { id },
      data: updateData,
    });

    return success(interview);
  } catch (err) {
    console.error('Update interview error:', err);
    return badRequest('更新面试失败');
  }
}

// POST /api/interviews/[id]/evaluate - Submit evaluation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { technicalScore, communicationScore, cultureScore, overallScore, strengths, weaknesses, recommendation, comments } = body;

    const evaluation = await prisma.interviewEvaluation.create({
      data: {
        interviewId: id,
        evaluatorId: user.userId,
        technicalScore,
        communicationScore,
        cultureScore,
        overallScore,
        strengths,
        weaknesses,
        recommendation,
        comments,
      },
    });

    return success(evaluation);
  } catch (err) {
    console.error('Submit evaluation error:', err);
    return badRequest('提交评价失败');
  }
}
