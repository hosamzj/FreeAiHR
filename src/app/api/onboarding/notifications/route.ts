import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// GET /api/onboarding/notifications - 获取入职通知列表
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    const { searchParams } = new URL(request.url);
    const onboardingId = searchParams.get('onboardingId');
    const status = searchParams.get('status');
    const notificationType = searchParams.get('notificationType');

    const where: Record<string, unknown> = {};
    if (onboardingId) where.onboardingId = onboardingId;
    if (status) where.status = status;
    if (notificationType) where.notificationType = notificationType;

    const notifications = await prisma.onboardingNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return success(notifications);
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
    return error(500, '获取通知列表失败');
  }
}

// POST /api/onboarding/notifications - 创建通知
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    const body = await request.json();
    const { onboardingId, notificationType, recipientType, recipientId, recipientName, recipientEmail, content, aiGenerated } = body;

    if (!onboardingId || !notificationType || !recipientType) {
      return error(422, '缺少必要参数');
    }

    // 获取入职信息
    const onboarding = await prisma.onboarding.findUnique({
      where: { id: onboardingId },
    });

    if (!onboarding) {
      return error(404, '入职记录不存在');
    }

    const notification = await prisma.onboardingNotification.create({
      data: {
        onboardingId,
        notificationType,
        recipientType,
        recipientId: recipientId || null,
        recipientName: recipientName || null,
        recipientEmail: recipientEmail || null,
        content: content ? JSON.stringify(content) : null,
        aiGenerated: aiGenerated || false,
        status: 'pending',
      },
    });

    return success(notification, '通知创建成功');
  } catch (err) {
    console.error('Failed to create notification:', err);
    return error(500, '创建通知失败');
  }
}

// PUT /api/onboarding/notifications - 更新通知状态
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return error(422, '缺少必要参数');
    }

    const notification = await prisma.onboardingNotification.update({
      where: { id },
      data: {
        status,
        sentAt: status === 'sent' ? new Date() : undefined,
        acknowledgedAt: status === 'acknowledged' ? new Date() : undefined,
      },
    });

    return success(notification, '通知状态更新成功');
  } catch (err) {
    console.error('Failed to update notification:', err);
    return error(500, '更新通知失败');
  }
}
