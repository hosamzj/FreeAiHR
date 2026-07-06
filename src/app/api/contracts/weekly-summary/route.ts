import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// GET /api/contracts/weekly-summary - 获取周报摘要
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // 周日
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // 获取本周待处理的提醒
    const pendingReminders = await prisma.contractReminder.findMany({
      where: {
        status: { in: ['pending', 'sent'] },
        scheduledAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // 获取提醒关联的合同信息
    const contractIds = [...new Set(pendingReminders.map(r => r.contractId))];
    const contracts = await prisma.contract.findMany({
      where: { id: { in: contractIds } },
      select: {
        id: true,
        employeeName: true,
        department: true,
        endDate: true,
        status: true,
      },
    });
    const contractMap = new Map(contracts.map(c => [c.id, c]));

    // 获取逾期合同
    const overdueContracts = await prisma.contract.findMany({
      where: {
        endDate: { lt: now },
        status: { notIn: ['renewed', 'terminated'] },
      },
      select: {
        id: true,
        employeeName: true,
        department: true,
        endDate: true,
        status: true,
      },
    });

    // 获取本周已完成的续签
    const completedRenewals = await prisma.contract.findMany({
      where: {
        status: 'renewed',
        renewExecutedAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: {
        id: true,
        employeeName: true,
        department: true,
        endDate: true,
        renewExecutedAt: true,
      },
    });

    // 获取即将到期的合同（未来30天）
    const upcomingExpiring = await prisma.contract.findMany({
      where: {
        endDate: {
          gte: now,
          lt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
        status: { notIn: ['renewed', 'terminated'] },
      },
      select: {
        id: true,
        employeeName: true,
        department: true,
        endDate: true,
        status: true,
      },
      orderBy: { endDate: 'asc' },
    });

    // 按提醒类型分组
    const remindersByType = {
      'T-45': pendingReminders.filter(r => r.reminderType === 'T-45'),
      'T-30': pendingReminders.filter(r => r.reminderType === 'T-30'),
      'T-15': pendingReminders.filter(r => r.reminderType === 'T-15'),
      'T-7': pendingReminders.filter(r => r.reminderType === 'T-7'),
      'overdue': pendingReminders.filter(r => r.reminderType === 'overdue'),
    };

    return success({
      weekStart,
      weekEnd,
      summary: {
        pendingCount: pendingReminders.length,
        overdueCount: overdueContracts.length,
        completedCount: completedRenewals.length,
        upcomingCount: upcomingExpiring.length,
      },
      pendingReminders: pendingReminders.map(r => ({
        ...r,
        contract: contractMap.get(r.contractId),
      })),
      remindersByType,
      overdueContracts,
      completedRenewals,
      upcomingExpiring,
    });
  } catch (err) {
    console.error('Failed to get weekly summary:', err);
    return error(500, '获取周报摘要失败');
  }
}
