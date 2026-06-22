import { prisma } from '@/lib/prisma';
import { requireAuth, success, unauthorized } from '@/lib/auth';

// GET /api/dashboard
export async function GET() {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const [
    totalCandidates,
    totalPositions,
    totalInterviews,
    pendingOffers,
    newThisWeek,
    hiredCount,
  ] = await Promise.all([
    prisma.candidate.count(),
    prisma.jobPosition.count({ where: { status: 'open' } }),
    prisma.interview.count({ where: { status: 'scheduled' } }),
    prisma.offer.count({ where: { status: { in: ['pending_approval', 'approved'] } } }),
    prisma.candidate.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.candidate.count({ where: { status: 'hired' } }),
  ]);

  // Funnel data
  const [screening, interviewing, offered, hired] = await Promise.all([
    prisma.candidate.count({ where: { status: { in: ['screening', 'new'] } } }),
    prisma.candidate.count({ where: { status: 'interviewing' } }),
    prisma.candidate.count({ where: { status: 'offered' } }),
    prisma.candidate.count({ where: { status: 'hired' } }),
  ]);

  // Department stats
  const departments = await prisma.jobPosition.groupBy({
    by: ['department'],
    _count: { id: true },
  });

  // Recent candidates
  const recentCandidates = await prisma.candidate.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, name: true, appliedPosition: true, status: true, matchScore: true, createdAt: true },
  });

  // Upcoming interviews
  const upcomingInterviews = await prisma.interview.findMany({
    where: { scheduledAt: { gte: new Date() }, status: 'scheduled' },
    take: 5,
    include: {
      candidate: { select: { name: true, appliedPosition: true } },
      interviewer: { select: { name: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return success({
    stats: {
      totalCandidates,
      totalPositions,
      totalInterviews,
      pendingOffers,
      newThisWeek,
      hiredCount,
    },
    funnel: [
      { stage: '简历', count: totalCandidates },
      { stage: '筛选', count: screening },
      { stage: '面试', count: interviewing },
      { stage: 'Offer', count: offered },
      { stage: '入职', count: hired },
    ],
    departments: departments.map((d) => ({
      department: d.department,
      openPositions: d._count.id,
    })),
    recentCandidates,
    upcomingInterviews: upcomingInterviews.map((i) => ({
      id: i.id,
      candidateName: i.candidate.name,
      position: i.candidate.appliedPosition || '',
      interviewer: i.interviewer.name,
      scheduledAt: i.scheduledAt,
      type: i.type,
    })),
  });
}
