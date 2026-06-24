import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// GET /api/onboarding/[id]/timeline - 获取入职状态追踪时间线
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    const { id } = await params;

    // 获取入职信息
    const onboarding = await prisma.onboarding.findUnique({
      where: { id },
    });

    if (!onboarding) {
      return error(404, '入职记录不存在');
    }

    // 获取任务列表
    const tasks = await prisma.onboardingTask.findMany({
      where: { onboardingId: id },
      orderBy: { createdAt: 'asc' },
    });

    // 获取通知记录
    const notifications = await prisma.onboardingNotification.findMany({
      where: { onboardingId: id },
      orderBy: { createdAt: 'asc' },
    });

    // 构建时间线
    const timeline: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      timestamp: Date;
      actor: string;
      status?: string;
    }> = [];

    // 添加入职创建事件
    timeline.push({
      id: 'onboarding-created',
      type: 'system',
      title: '入职流程创建',
      description: `入职日期：${new Date(onboarding.startDate).toLocaleDateString()}`,
      timestamp: onboarding.createdAt,
      actor: '系统',
    });

    // 添加任务完成事件
    for (const task of tasks) {
      if (task.completedAt) {
        timeline.push({
          id: `task-${task.id}`,
          type: 'task',
          title: `任务完成：${task.title}`,
          description: task.description || `${task.category}类别任务已完成`,
          timestamp: task.completedAt,
          actor: task.assigneeName || '负责人',
          status: 'completed',
        });
      }
    }

    // 添加通知事件
    for (const notification of notifications) {
      let title = '';
      switch (notification.notificationType) {
        case 'completion_notice':
          title = '入职完成通知';
          break;
        case 'training_reminder':
          title = '培训安排提醒';
          break;
        case 'anomaly_alert':
          title = '异常提醒';
          break;
        default:
          title = notification.notificationType;
      }

      timeline.push({
        id: `notification-${notification.id}`,
        type: 'notification',
        title,
        description: `发送给${notification.recipientName || notification.recipientType}`,
        timestamp: notification.sentAt || notification.createdAt,
        actor: '系统',
        status: notification.status,
      });
    }

    // 添加回访事件
    if (onboarding.day7FollowUpAt) {
      timeline.push({
        id: 'day7-followup',
        type: 'followup',
        title: '7天回访',
        description: '已完成7天入职回访',
        timestamp: onboarding.day7FollowUpAt,
        actor: 'HR',
        status: 'completed',
      });
    }

    if (onboarding.day30FollowUpAt) {
      timeline.push({
        id: 'day30-followup',
        type: 'followup',
        title: '30天回访',
        description: '已完成30天入职回访',
        timestamp: onboarding.day30FollowUpAt,
        actor: 'HR',
        status: 'completed',
      });
    }

    // 按时间排序
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 构建任务清单状态
    const taskCategories = {
      it: { name: 'IT准备', tasks: tasks.filter(t => t.category === 'it') },
      admin: { name: '行政准备', tasks: tasks.filter(t => t.category === 'admin') },
      training: { name: '培训安排', tasks: tasks.filter(t => t.category === 'training') },
      team: { name: '部门接待', tasks: tasks.filter(t => t.category === 'team') },
    };

    // 计算整体进度
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 检测异常
    const anomalies: string[] = [];
    if (onboarding.startDate < new Date() && onboarding.status !== 'completed') {
      anomalies.push('入职日期已过但状态未完成');
    }
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    if (pendingTasks.length > 3) {
      anomalies.push(`待完成任务过多（${pendingTasks.length}项）`);
    }

    const result = {
      onboarding: {
        id: onboarding.id,
        employeeName: onboarding.employeeName,
        position: onboarding.position,
        department: onboarding.department,
        startDate: onboarding.startDate,
        status: onboarding.status,
        itReady: onboarding.itReady,
        adminReady: onboarding.adminReady,
        trainingReady: onboarding.trainingReady,
        teamReady: onboarding.teamReady,
        day7FollowUp: onboarding.day7FollowUp,
        day30FollowUp: onboarding.day30FollowUp,
      },
      timeline,
      taskCategories,
      progress,
      anomalies,
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.notificationType,
        recipientType: n.recipientType,
        recipientName: n.recipientName,
        status: n.status,
        sentAt: n.sentAt,
      })),
    };

    return success(result);
  } catch (err) {
    console.error('Failed to fetch onboarding timeline:', err);
    return error(500, '获取时间线失败');
  }
}
