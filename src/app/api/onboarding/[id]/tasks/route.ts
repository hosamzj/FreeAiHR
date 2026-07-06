import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// GET /api/onboarding/[id]/tasks - 获取入职任务列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const tasks = await prisma.onboardingTask.findMany({
      where: { onboardingId: id },
      orderBy: [{ category: 'asc' }, { dueDate: 'asc' }],
    });

    const onboarding = await prisma.onboarding.findUnique({ where: { id } });

    return success({ onboarding, tasks });
  } catch (e) {
    console.error('Get onboarding tasks error:', e);
    return error(500, '获取入职任务失败');
  }
}

// PUT /api/onboarding/[id]/tasks - 更新入职任务
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { taskId, status, assigneeId, assigneeName } = body;

    if (!taskId) return error(422, '任务ID不能为空');

    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status;
      if (status === 'completed') updateData.completedAt = new Date();
    }
    if (assigneeId) updateData.assigneeId = assigneeId;
    if (assigneeName) updateData.assigneeName = assigneeName;

    const task = await prisma.onboardingTask.update({
      where: { id: taskId },
      data: updateData,
    });

    // Check if all tasks are completed
    const allTasks = await prisma.onboardingTask.findMany({
      where: { onboardingId: id },
    });
    const allCompleted = allTasks.every(t => t.status === 'completed');

    if (allCompleted) {
      await prisma.onboarding.update({
        where: { id },
        data: { status: 'completed' },
      });
    }

    return success(task);
  } catch (e) {
    console.error('Update onboarding task error:', e);
    return error(500, '更新入职任务失败');
  }
}
