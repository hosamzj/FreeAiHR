import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, unauthorized, badRequest } from '@/lib/auth';

// GET /api/interviews
export async function GET(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || '';
  const interviewerId = searchParams.get('interviewerId') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (interviewerId) where.interviewerId = interviewerId;
  if (startDate || endDate) {
    where.scheduledAt = {};
    if (startDate) (where.scheduledAt as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.scheduledAt as Record<string, unknown>).lte = new Date(endDate);
  }

  // Interviewers can only see their own interviews
  if (user.role === 'interviewer') {
    where.interviewerId = user.userId;
  }

  const interviews = await prisma.interview.findMany({
    where,
    include: {
      candidate: { select: { id: true, name: true, appliedPosition: true, avatar: true } },
      interviewer: { select: { id: true, name: true, department: true } },
      evaluations: true,
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return success(interviews);
}

// POST /api/interviews
export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { candidateId, positionId, interviewerId, type, scheduledAt, duration, location } = body;

    if (!candidateId || !interviewerId || !scheduledAt) {
      return badRequest('请填写必要信息');
    }

    // Check for conflicts
    const conflict = await prisma.interview.findFirst({
      where: {
        interviewerId,
        scheduledAt: new Date(scheduledAt),
        status: 'scheduled',
      },
    });

    if (conflict) {
      return badRequest('该面试官在此时间段已有面试安排（冲突检测）');
    }

    const interview = await prisma.interview.create({
      data: {
        candidateId,
        positionId: positionId || null,
        interviewerId,
        type: type || 'first',
        scheduledAt: new Date(scheduledAt),
        duration: duration || 60,
        location: location || null,
        status: 'scheduled',
      },
      include: {
        candidate: { select: { name: true, appliedPosition: true } },
        interviewer: { select: { name: true } },
      },
    });

    return success(interview);
  } catch (err) {
    console.error('Create interview error:', err);
    return badRequest('创建面试失败');
  }
}
