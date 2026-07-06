import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// GET /api/dashboard/workflow-overview - 获取全链路概览数据
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    // 招聘中：状态为pending/interview/offer的候选人
    const recruitingCount = await prisma.candidate.count({
      where: {
        status: { in: ['new', 'screening', 'interview', 'offer'] },
      },
    });

    // 待签合同：状态为pending_sign或signing的合同
    const pendingContractCount = await prisma.contract.count({
      where: {
        status: { in: ['pending_sign', 'signing'] },
      },
    });

    // 入职办理中：状态不为completed的入职记录
    const onboardingCount = await prisma.onboarding.count({
      where: {
        status: { not: 'completed' },
      },
    });

    // 本月已完成入职
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = await prisma.onboarding.count({
      where: {
        status: 'completed',
        updatedAt: { gte: startOfMonth },
      },
    });

    // 获取最近的状态变更
    const recentActivities = await prisma.contract.findMany({
      where: {
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        employeeName: true,
        status: true,
        updatedAt: true,
      },
    });

    return success({
      overview: {
        recruiting: recruitingCount,
        pendingContract: pendingContractCount,
        onboarding: onboardingCount,
        completedThisMonth: completedThisMonth,
      },
      recentActivities: recentActivities.map(a => ({
        id: a.id,
        type: 'contract',
        employeeName: a.employeeName,
        status: a.status,
        updatedAt: a.updatedAt,
      })),
    });
  } catch (err) {
    console.error('Get workflow overview error:', err);
    return error(500, '获取概览数据失败');
  }
}
