import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// GET /api/contracts/reminders - 获取合同提醒列表
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');
    const status = searchParams.get('status');
    const reminderType = searchParams.get('reminderType');

    const where: Record<string, unknown> = {};
    if (contractId) where.contractId = contractId;
    if (status) where.status = status;
    if (reminderType) where.reminderType = reminderType;

    const reminders = await prisma.contractReminder.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      take: 100,
    });

    return success(reminders);
  } catch (err) {
    console.error('Failed to fetch reminders:', err);
    return error(500, '获取提醒列表失败');
  }
}

// POST /api/contracts/reminders - 创建/发送提醒
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    const body = await request.json();
    const { contractId, reminderType, recipientType, recipientId, recipientName, recipientEmail, content, aiGenerated } = body;

    if (!contractId || !reminderType || !recipientType) {
      return error(422, '缺少必要参数');
    }

    // 获取合同信息
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return error(404, '合同不存在');
    }

    // 计算计划发送时间
    const endDate = new Date(contract.endDate);
    const now = new Date();
    let daysBefore = 0;
    switch (reminderType) {
      case 'T-45': daysBefore = 45; break;
      case 'T-30': daysBefore = 30; break;
      case 'T-15': daysBefore = 15; break;
      case 'T-7': daysBefore = 7; break;
      case 'overdue': daysBefore = 0; break;
      default: daysBefore = 0;
    }
    const scheduledAt = new Date(endDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);

    const reminder = await prisma.contractReminder.create({
      data: {
        contractId,
        reminderType,
        recipientType,
        recipientId: recipientId || null,
        recipientName: recipientName || null,
        recipientEmail: recipientEmail || null,
        scheduledAt: scheduledAt > now ? scheduledAt : now,
        content: content ? JSON.stringify(content) : null,
        aiGenerated: aiGenerated || false,
        status: 'pending',
      },
    });

    // 记录日志
    await prisma.contractReminderLog.create({
      data: {
        contractId,
        reminderId: reminder.id,
        action: 'reminder_created',
        actorId: auth.userId,
        actorName: auth.name,
        actorRole: auth.role,
        details: JSON.stringify({ reminderType, recipientType, recipientName }),
      },
    });

    return success(reminder, '提醒创建成功');
  } catch (err) {
    console.error('Failed to create reminder:', err);
    return error(500, '创建提醒失败');
  }
}

// PUT /api/contracts/reminders - 更新提醒状态
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    const body = await request.json();
    const { id, status, acknowledgedAt } = body;

    if (!id || !status) {
      return error(422, '缺少必要参数');
    }

    const reminder = await prisma.contractReminder.update({
      where: { id },
      data: {
        status,
        acknowledgedAt: status === 'acknowledged' ? new Date() : acknowledgedAt,
        sentAt: status === 'sent' ? new Date() : undefined,
      },
    });

    // 记录日志
    await prisma.contractReminderLog.create({
      data: {
        contractId: reminder.contractId,
        reminderId: reminder.id,
        action: `reminder_${status}`,
        actorId: auth.userId,
        actorName: auth.name,
        actorRole: auth.role,
        previousStatus: reminder.status,
        newStatus: status,
      },
    });

    return success(reminder, '提醒状态更新成功');
  } catch (err) {
    console.error('Failed to update reminder:', err);
    return error(500, '更新提醒失败');
  }
}
