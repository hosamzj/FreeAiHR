import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// GET /api/onboarding/dashboard - 入职进度看板
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const onboardings = await prisma.onboarding.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });

    // Enrich with task progress
    const enriched = await Promise.all(
      onboardings.map(async (o) => {
        const tasks = await prisma.onboardingTask.findMany({
          where: { onboardingId: o.id },
        });
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const totalTasks = tasks.length;

        return {
          ...o,
          tasks,
          progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          completedTasks,
          totalTasks,
          daysSinceStart: Math.floor((new Date().getTime() - new Date(o.startDate).getTime()) / (1000 * 60 * 60 * 24)),
        };
      })
    );

    // Summary stats
    const stats = {
      total: onboardings.length,
      pending: onboardings.filter(o => o.status === 'pending').length,
      inProgress: onboardings.filter(o => o.status === 'in_progress').length,
      completed: onboardings.filter(o => o.status === 'completed').length,
      needFollowUp: onboardings.filter(o => !o.day7FollowUp && new Date(o.startDate) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    };

    return success({ onboardings: enriched, stats });
  } catch (e) {
    console.error('Get onboarding dashboard error:', e);
    return error(500, '获取入职看板失败');
  }
}
