import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// GET /api/contracts - 获取合同列表
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { endDate: 'asc' },
    });

    return success(contracts);
  } catch (e) {
    console.error('Get contracts error:', e);
    return error(500, '获取合同列表失败');
  }
}

// POST /api/contracts - 创建合同
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { employeeId, employeeName, department, position, contractType, startDate, endDate } = body;

    if (!employeeId || !employeeName || !startDate || !endDate) {
      return error(422, '缺少必要字段');
    }

    // 生成合同编号：HT-YYYYMMDD-XXXX
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');
    
    // 查询今天已有的合同数量，用于生成序号
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const todayContracts = await prisma.contract.count({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });
    
    const contractNo = `HT-${dateStr}-${(todayContracts + 1).toString().padStart(4, '0')}`;

    const contract = await prisma.contract.create({
      data: {
        contractNo,
        employeeId,
        employeeName,
        department,
        position,
        contractType: contractType || 'regular',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    return success(contract);
  } catch (e) {
    console.error('Create contract error:', e);
    return error(500, '创建合同失败');
  }
}

// PUT /api/contracts - 更新合同
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return error(422, '合同ID不能为空');

    // 获取原始合同信息以检测状态变更
    const originalContract = await prisma.contract.findUnique({ where: { id } });
    const wasNotCompleted = originalContract && originalContract.status !== 'completed';
    const isNowCompleted = data.status === 'completed';

    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.renewNotes !== undefined) updateData.renewNotes = data.renewNotes;

    const contract = await prisma.contract.update({
      where: { id },
      data: updateData,
    });

    // 如果状态变为completed，自动触发入职流程
    if (wasNotCompleted && isNowCompleted) {
      try {
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
            contractId: id,
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
          { title: '入职培训', assigneeName: '培训', category: 'training', dueDate: new Date(contract.startDate.getTime() + 3 * 24 * 60 * 60 * 1000) },
          { title: '部门接待', assigneeName: '用人部门', category: 'team', dueDate: contract.startDate },
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
      } catch (onboardingErr) {
        console.error('Auto initiate onboarding error:', onboardingErr);
        // 不阻断主流程，记录错误即可
      }
    }

    return success(contract);
  } catch (e) {
    console.error('Update contract error:', e);
    return error(500, '更新合同失败');
  }
}
