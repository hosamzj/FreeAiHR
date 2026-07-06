import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

const TASKS_KEY = 'collection_tasks';

// GET - 获取采集任务列表
export async function GET() {
  try {
    await requireAuth();

    const config = await prisma.systemConfig.findUnique({
      where: { key: TASKS_KEY },
    });

    if (!config) {
      return success({
        tasks: [],
        total: 0,
      });
    }

    let tasks: Array<{
      id: string;
      type: string;
      source: string;
      status: string;
      total: number;
      imported: number;
      createdAt: string;
      completedAt?: string;
      duration?: number;
    }> = [];

    try {
      tasks = JSON.parse(config.value);
    } catch {
      tasks = [];
    }

    return success({
      tasks,
      total: tasks.length,
    });
  } catch (err) {
    console.error('Get tasks error:', err);
    return error(500, '获取任务列表失败', 500);
  }
}

// POST - 创建采集任务
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { type, source, config } = body;

    if (!type || !source) {
      return error(422, '请提供任务类型和来源');
    }

    const taskId = `task_${Date.now()}`;
    const task = {
      id: taskId,
      type,
      source,
      status: 'running',
      total: 0,
      imported: 0,
      config: config || {},
      createdAt: new Date().toISOString(),
    };

    // 获取现有任务
    const existing = await prisma.systemConfig.findUnique({
      where: { key: TASKS_KEY },
    });

    let tasks: Array<Record<string, unknown>> = [];
    if (existing) {
      try {
        tasks = JSON.parse(existing.value);
      } catch {
        tasks = [];
      }
    }

    tasks.unshift(task);

    await prisma.systemConfig.upsert({
      where: { key: TASKS_KEY },
      update: { value: JSON.stringify(tasks) },
      create: { key: TASKS_KEY, value: JSON.stringify(tasks) },
    });

    return success(task, '任务创建成功');
  } catch (err) {
    console.error('Create task error:', err);
    return error(500, '创建任务失败', 500);
  }
}

// PUT - 更新任务状态（暂停/恢复/取消）
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { taskId, action } = body;

    if (!taskId || !action) {
      return error(422, '请提供任务ID和操作');
    }

    const validActions = ['pause', 'resume', 'cancel'];
    if (!validActions.includes(action)) {
      return error(422, '无效的操作，支持: pause, resume, cancel');
    }

    const existing = await prisma.systemConfig.findUnique({
      where: { key: TASKS_KEY },
    });

    if (!existing) {
      return error(404, '任务不存在');
    }

    let tasks: Array<{
      id: string;
      status: string;
      completedAt?: string;
    }> = [];

    try {
      tasks = JSON.parse(existing.value);
    } catch {
      return error(500, '任务数据格式错误');
    }

    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return error(404, '任务不存在');
    }

    const task = tasks[taskIndex];
    const statusMap: Record<string, string> = {
      pause: 'paused',
      resume: 'running',
      cancel: 'cancelled',
    };

    task.status = statusMap[action];
    if (action === 'cancel') {
      task.completedAt = new Date().toISOString();
    }

    tasks[taskIndex] = task;

    await prisma.systemConfig.update({
      where: { key: TASKS_KEY },
      data: { value: JSON.stringify(tasks) },
    });

    return success(task, `任务已${action === 'pause' ? '暂停' : action === 'resume' ? '恢复' : '取消'}`);
  } catch (err) {
    console.error('Update task error:', err);
    return error(500, '更新任务失败', 500);
  }
}

// DELETE - 删除任务
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');

    if (!taskId) {
      return error(422, '请提供任务ID');
    }

    const existing = await prisma.systemConfig.findUnique({
      where: { key: TASKS_KEY },
    });

    if (!existing) {
      return error(404, '任务不存在');
    }

    let tasks: Array<{ id: string }> = [];
    try {
      tasks = JSON.parse(existing.value);
    } catch {
      return error(500, '任务数据格式错误');
    }

    const filtered = tasks.filter((t) => t.id !== taskId);

    await prisma.systemConfig.update({
      where: { key: TASKS_KEY },
      data: { value: JSON.stringify(filtered) },
    });

    return success(null, '任务删除成功');
  } catch (err) {
    console.error('Delete task error:', err);
    return error(500, '删除任务失败', 500);
  }
}
