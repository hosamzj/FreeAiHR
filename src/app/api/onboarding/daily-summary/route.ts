import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// Helper function to get daily summary data
async function getDailySummaryData(targetDate: Date) {
  const nextDate = new Date(targetDate);
  nextDate.setDate(targetDate.getDate() + 1);

  // 查找或创建当日汇总
  let summary = await prisma.onboardingDailySummary.findFirst({
    where: {
      summaryDate: targetDate,
    },
  });

  if (!summary) {
    // 获取当日完成入职的员工
    const completedOnboardings = await prisma.onboarding.findMany({
      where: {
        status: 'completed',
        updatedAt: {
          gte: targetDate,
          lt: nextDate,
        },
      },
      select: {
        id: true,
        employeeName: true,
        position: true,
        department: true,
        startDate: true,
      },
    });

    // 获取待处理的入职
    const pendingOnboardings = await prisma.onboarding.findMany({
      where: {
        status: { in: ['pending', 'in_progress'] },
        startDate: {
          gte: targetDate,
          lt: nextDate,
        },
      },
      select: {
        id: true,
        employeeName: true,
        position: true,
        department: true,
        startDate: true,
        status: true,
      },
    });

    // 检测异常（简化逻辑：检查任务完成情况）
    const anomalyOnboardings: Array<{
      id: string;
      employeeName: string;
      anomalies: string[];
    }> = [];

    for (const onboarding of pendingOnboardings) {
      const anomalies: string[] = [];
      
      // 检查任务完成情况
      const tasks = await prisma.onboardingTask.findMany({
        where: { onboardingId: onboarding.id },
      });

      const pendingTasks = tasks.filter(t => t.status === 'pending');
      if (pendingTasks.length > 3) {
        anomalies.push(`待完成任务过多（${pendingTasks.length}项）`);
      }

      // 检查是否超过入职日期仍未完成
      if (onboarding.startDate < new Date() && onboarding.status !== 'completed') {
        anomalies.push('入职日期已过但状态未完成');
      }

      if (anomalies.length > 0) {
        anomalyOnboardings.push({
          id: onboarding.id,
          employeeName: onboarding.employeeName,
          anomalies,
        });
      }
    }

    // 创建汇总记录
    summary = await prisma.onboardingDailySummary.create({
      data: {
        summaryDate: targetDate,
        completedCount: completedOnboardings.length,
        pendingCount: pendingOnboardings.length,
        anomalyCount: anomalyOnboardings.length,
        completedList: JSON.stringify(completedOnboardings),
        pendingList: JSON.stringify(pendingOnboardings),
        anomalyList: JSON.stringify(anomalyOnboardings),
      },
    });
  }

  // 解析JSON字段
  return {
    ...summary,
    completedList: JSON.parse(summary.completedList || '[]'),
    pendingList: JSON.parse(summary.pendingList || '[]'),
    anomalyList: JSON.parse(summary.anomalyList || '[]'),
  };
}

// GET /api/onboarding/daily-summary - 获取每日汇总
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYY-MM-DD format

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const result = await getDailySummaryData(targetDate);
    return success(result);
  } catch (err) {
    console.error('Failed to fetch daily summary:', err);
    return error(500, '获取每日汇总失败');
  }
}

// POST /api/onboarding/daily-summary - 手动触发每日汇总
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    const body = await request.json();
    const { date, notifyRecipients } = body;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // 获取汇总数据
    const result = await getDailySummaryData(targetDate);

    // 如果指定了通知接收人，记录通知
    if (notifyRecipients && Array.isArray(notifyRecipients)) {
      for (const recipient of notifyRecipients) {
        await prisma.onboardingNotification.create({
          data: {
            onboardingId: 'daily-summary',
            notificationType: 'daily_summary',
            recipientType: recipient.type || 'hrbp',
            recipientName: recipient.name || null,
            recipientEmail: recipient.email || null,
            content: JSON.stringify(result),
            aiGenerated: true,
            status: 'pending',
          },
        });
      }
    }

    return success(result, '每日汇总生成成功');
  } catch (err) {
    console.error('Failed to generate daily summary:', err);
    return error(500, '生成每日汇总失败');
  }
}
