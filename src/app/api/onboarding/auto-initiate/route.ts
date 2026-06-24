import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// POST /api/onboarding/auto-initiate - 从合同数据自动创建入职记录并触发通知
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    const body = await request.json();
    const { contractId } = body;

    if (!contractId) {
      return error(422, '缺少合同ID');
    }

    // 获取合同信息
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return error(404, '合同不存在');
    }

    if (contract.status !== 'completed') {
      return error(400, '合同状态未完成，无法触发入职流程');
    }

    // 检查是否已存在入职记录
    const existingOnboarding = await prisma.onboarding.findFirst({
      where: {
        candidateId: contract.candidateId || '',
      },
    });

    if (existingOnboarding) {
      return error(400, '该候选人已存在入职记录');
    }

    // 获取候选人信息（如果有）
    let candidate = null;
    if (contract.candidateId) {
      candidate = await prisma.candidate.findUnique({
        where: { id: contract.candidateId },
      });
    }

    // 创建入职记录
    const onboarding = await prisma.onboarding.create({
      data: {
        candidateId: contract.candidateId || `cand_${Date.now()}`,
        employeeName: contract.employeeName,
        position: contract.position,
        department: contract.department,
        employeeId: contract.employeeId,
        onboardingDate: contract.startDate,
        startDate: contract.startDate,
        status: 'notified',
        contractId,
        itAccountReady: false,
        equipmentReady: false,
        trainingScheduled: false,
        introductionDone: false,
        day7FollowUp: false,
        day30FollowUp: false,
      },
    });

    // 创建默认入职任务
    const tasks = [
      { title: '开通账号', assigneeName: 'IT', category: 'it', dueDate: contract.startDate },
      { title: '配置设备', assigneeName: 'IT', category: 'it', dueDate: contract.startDate },
      { title: '工位安排', assigneeName: '行政', category: 'admin', dueDate: contract.startDate },
      { title: '门禁卡', assigneeName: '行政', category: 'admin', dueDate: contract.startDate },
      { title: 'E-Learning', assigneeName: '培训', category: 'training', dueDate: new Date(contract.startDate.getTime() + 7 * 24 * 60 * 60 * 1000) },
      { title: '入职培训', assigneeName: '培训', category: 'training', dueDate: new Date(contract.startDate.getTime() + 3 * 24 * 60 * 60 * 1000) },
      { title: '部门接待', assigneeName: '用人部门', category: 'team', dueDate: contract.startDate },
      { title: '岗位介绍', assigneeName: '用人部门', category: 'team', dueDate: contract.startDate },
    ];

    for (const task of tasks) {
      await prisma.onboardingTask.create({
        data: {
          onboardingId: onboarding.id,
          title: task.title,
          assigneeName: task.assigneeName,
          category: task.category,
          dueDate: task.dueDate,
          status: 'pending',
        },
      });
    }

    // 创建通知记录
    await prisma.onboardingNotification.create({
      data: {
        onboardingId: onboarding.id,
        notificationType: 'completion_notice',
        recipientType: 'manager',
        recipientEmail: 'manager@company.com',
        content: `新员工 ${contract.employeeName} 已完成入职办理，请安排部门接待。`,
        status: 'sent',
      },
    });

    await prisma.onboardingNotification.create({
      data: {
        onboardingId: onboarding.id,
        notificationType: 'training_reminder',
        recipientType: 'trainer',
        recipientEmail: 'training@company.com',
        content: `新员工 ${contract.employeeName} 入职完成，请安排培训。`,
        status: 'sent',
      },
    });

    return success({
      onboarding,
      tasksCreated: tasks.length,
      notificationsSent: 2,
      message: '入职流程已自动触发',
    });
  } catch (err) {
    console.error('Auto initiate onboarding error:', err);
    return error(500, '触发入职流程失败');
  }
}
