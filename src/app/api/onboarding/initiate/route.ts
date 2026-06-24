import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// POST /api/onboarding/initiate - 发起入职流程
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { candidateId, employeeName, position, department, managerId, mentorId, startDate } = body;

    if (!candidateId || !employeeName || !startDate) {
      return error(422, '缺少必要字段');
    }

    // Create onboarding record
    const onboarding = await prisma.onboarding.create({
      data: {
        candidateId,
        employeeName,
        position,
        department,
        managerId,
        mentorId,
        startDate: new Date(startDate),
        status: 'pending',
      },
    });

    // Create default tasks
    const defaultTasks = [
      { category: 'it', title: '开通企业邮箱', description: '创建公司邮箱账号', dueDate: new Date(new Date(startDate).getTime() - 2 * 24 * 60 * 60 * 1000) },
      { category: 'it', title: '配置电脑设备', description: '准备开发/办公设备', dueDate: new Date(new Date(startDate).getTime() - 1 * 24 * 60 * 60 * 1000) },
      { category: 'it', title: '开通系统权限', description: '配置代码仓库、内部系统权限', dueDate: new Date(startDate) },
      { category: 'admin', title: '安排工位', description: '准备办公工位和座位', dueDate: new Date(new Date(startDate).getTime() - 3 * 24 * 60 * 60 * 1000) },
      { category: 'admin', title: '制作门禁卡', description: '办理门禁卡和胸牌', dueDate: new Date(new Date(startDate).getTime() - 1 * 24 * 60 * 60 * 1000) },
      { category: 'training', title: '新员工培训', description: '安排入职培训和公司文化介绍', dueDate: new Date(new Date(startDate).getTime() + 1 * 24 * 60 * 60 * 1000) },
      { category: 'team', title: '入职引导', description: '部门介绍和团队认识', dueDate: new Date(startDate) },
      { category: 'team', title: '第一周任务', description: '制定第一周工作计划', dueDate: new Date(new Date(startDate).getTime() + 1 * 24 * 60 * 60 * 1000) },
    ];

    await Promise.all(
      defaultTasks.map(task =>
        prisma.onboardingTask.create({
          data: {
            onboardingId: onboarding.id,
            ...task,
          },
        })
      )
    );

    return success(onboarding);
  } catch (e) {
    console.error('Initiate onboarding error:', e);
    return error(500, '发起入职流程失败');
  }
}
