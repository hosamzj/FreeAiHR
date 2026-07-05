import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, success, unauthorized, forbidden, badRequest, serverError } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();
  const roleCheck = await requireRole('admin', 'hr_manager');
  if (!roleCheck) return forbidden();

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!status || !['pool', 'new', 'contacted', 'screening', 'interviewing', 'offered', 'hired', 'rejected', 'archived'].includes(status)) {
    return badRequest('无效的状态值');
  }

  const candidate = await prisma.candidate.update({
    where: { id },
    data: { status },
  });

  return success(candidate);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();
  const roleCheck = await requireRole('admin', 'hr_manager');
  if (!roleCheck) return forbidden();

  const { id } = await params;

  try {
    // Get all interview IDs for this candidate first
    const interviews = await prisma.interview.findMany({
      where: { candidateId: id },
      select: { id: true },
    });
    const interviewIds = interviews.map(i => i.id);

    // Use transactions to ensure atomicity
    await prisma.$transaction([
      // Delete InterviewEvaluations for this candidate's interviews
      prisma.interviewEvaluation.deleteMany({
        where: {
          interviewId: { in: interviewIds },
        },
      }),
      // Delete InterviewFeedback for this candidate's interviews
      prisma.interviewFeedback.deleteMany({
        where: {
          interviewId: { in: interviewIds },
        },
      }),
      // Delete InterviewPackages for this candidate's interviews
      prisma.interviewPackage.deleteMany({
        where: {
          interviewId: { in: interviewIds },
        },
      }),
      // Delete CandidateFeedback
      prisma.candidateFeedback.deleteMany({
        where: { candidateId: id },
      }),
      // Delete InterviewAnalyses
      prisma.interviewAnalysis.deleteMany({
        where: { candidateId: id },
      }),
      // Delete Applications
      prisma.application.deleteMany({
        where: { candidateId: id },
      }),
      // Delete Offers
      prisma.offer.deleteMany({
        where: { candidateId: id },
      }),
      // Delete Interviews
      prisma.interview.deleteMany({
        where: { candidateId: id },
      }),
      // Finally delete the candidate
      prisma.candidate.delete({
        where: { id },
      }),
    ]);

    return success(null, '删除成功');
  } catch (error) {
    console.error('Delete candidate error:', error);
    return serverError('删除失败，可能存在关联数据无法删除');
  }
}
