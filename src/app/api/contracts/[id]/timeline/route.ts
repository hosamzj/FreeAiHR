import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// GET /api/contracts/[id]/timeline - 获取合同状态追踪时间线
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

    // 获取合同信息
    const contract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      return error(404, '合同不存在');
    }

    // 获取提醒日志
    const logs = await prisma.contractReminderLog.findMany({
      where: { contractId: id },
      orderBy: { createdAt: 'desc' },
    });

    // 获取提醒记录
    const reminders = await prisma.contractReminder.findMany({
      where: { contractId: id },
      orderBy: { scheduledAt: 'asc' },
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

    // 添加合同创建事件
    timeline.push({
      id: 'contract-created',
      type: 'system',
      title: '合同创建',
      description: `合同开始日期：${new Date(contract.startDate).toLocaleDateString()}，结束日期：${new Date(contract.endDate).toLocaleDateString()}`,
      timestamp: contract.createdAt,
      actor: '系统',
    });

    // 添加续签发起事件
    if (contract.renewInitiatedAt && contract.renewInitiatedBy) {
      timeline.push({
        id: 'renew-initiated',
        type: 'action',
        title: '续签发起',
        description: '经理发起合同续签流程',
        timestamp: contract.renewInitiatedAt,
        actor: '经理',
        status: '待经理确认',
      });
    }

    // 添加续签审批事件
    if (contract.renewApprovedAt && contract.renewApprovedBy) {
      timeline.push({
        id: 'renew-approved',
        type: 'action',
        title: 'HRBP审批通过',
        description: 'HRBP审批通过续签申请',
        timestamp: contract.renewApprovedAt,
        actor: 'HRBP',
        status: '待员工签署',
      });
    }

    // 添加续签执行事件
    if (contract.renewExecutedAt && contract.renewExecutedBy) {
      timeline.push({
        id: 'renew-executed',
        type: 'action',
        title: '续签完成',
        description: 'HRS完成续签执行',
        timestamp: contract.renewExecutedAt,
        actor: 'HRS',
        status: '已完成',
      });
    }

    // 添加提醒日志事件
    for (const log of logs) {
      let title = '';
      let description = '';
      switch (log.action) {
        case 'reminder_created':
          title = '提醒创建';
          description = `创建了${log.details ? JSON.parse(log.details).reminderType : ''}提醒`;
          break;
        case 'reminder_sent':
          title = '提醒发送';
          description = `提醒已发送给${log.actorName || (log.details ? JSON.parse(log.details).recipientType : '') || '相关人员'}`;
          break;
        case 'reminder_acknowledged':
          title = '提醒确认';
          description = `${log.actorName || '相关人员'}已确认提醒`;
          break;
        case 'manager_confirmed':
          title = '经理确认';
          description = '经理已确认续签意向';
          break;
        case 'employee_signed':
          title = '员工签署';
          description = '员工已完成签署';
          break;
        case 'hr_signed':
          title = 'HR签署';
          description = 'HR已完成签署';
          break;
        case 'overdue':
          title = '逾期风险';
          description = '合同续签流程逾期未完成';
          break;
        default:
          title = log.action;
          description = log.details || '';
      }

      timeline.push({
        id: log.id,
        type: log.action.includes('reminder') ? 'reminder' : 'action',
        title,
        description,
        timestamp: log.createdAt,
        actor: log.actorName || log.actorRole || '系统',
        status: log.newStatus ?? undefined,
      });
    }

    // 按时间排序
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 构建状态追踪
    const statusTracking = {
      currentStatus: contract.status,
      stages: [
        {
          name: '待发起',
          completed: contract.renewInitiatedAt !== null,
          completedAt: contract.renewInitiatedAt,
          actor: '经理',
        },
        {
          name: '待经理确认',
          completed: contract.renewInitiatedAt !== null,
          completedAt: contract.renewInitiatedAt,
          actor: '经理',
        },
        {
          name: '待HRBP审批',
          completed: contract.renewApprovedAt !== null,
          completedAt: contract.renewApprovedAt,
          actor: 'HRBP',
        },
        {
          name: '待员工签署',
          completed: contract.renewExecutedAt !== null && contract.status === 'renewed',
          completedAt: null,
          actor: '员工',
        },
        {
          name: '待HR签署',
          completed: contract.status === 'renewed',
          completedAt: contract.renewExecutedAt,
          actor: 'HRS',
        },
        {
          name: '已完成',
          completed: contract.status === 'renewed',
          completedAt: contract.renewExecutedAt,
          actor: '系统',
        },
      ],
      pendingItems: [] as string[],
    };

    // 计算待完成项
    if (!contract.renewInitiatedAt) {
      statusTracking.pendingItems.push('待发起续签');
    }
    if (contract.renewInitiatedAt && !contract.renewApprovedAt) {
      statusTracking.pendingItems.push('待HRBP审批');
    }
    if (contract.renewApprovedAt && contract.status !== 'renewed') {
      statusTracking.pendingItems.push('待员工签署');
      statusTracking.pendingItems.push('待HR签署');
    }

    const result = {
      contract: {
        id: contract.id,
        employeeName: contract.employeeName,
        department: contract.department,
        position: contract.position,
        startDate: contract.startDate,
        endDate: contract.endDate,
        status: contract.status,
      },
      timeline,
      statusTracking,
      reminders: reminders.map(r => ({
        id: r.id,
        type: r.reminderType,
        recipientType: r.recipientType,
        recipientName: r.recipientName,
        status: r.status,
        scheduledAt: r.scheduledAt,
        sentAt: r.sentAt,
      })),
    };

    return success(result);
  } catch (err) {
    console.error('Failed to fetch contract timeline:', err);
    return error(500, '获取时间线失败');
  }
}
