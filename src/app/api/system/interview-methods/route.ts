import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, error, success } from '@/lib/auth';

const CONFIG_KEY = 'interview_methods';

// Default interview methods
const DEFAULT_METHODS = [
  { id: 'offline', name: '线下面试', order: 1 },
  { id: 'phone', name: '电话面试', order: 2 },
  { id: 'teams', name: 'Teams视频面试', order: 3 },
  { id: 'zoom', name: 'Zoom视频面试', order: 4 },
  { id: 'tencent', name: '腾讯会议', order: 5 },
];

interface InterviewMethod {
  id: string;
  name: string;
  order: number;
}

// GET - Get all interview methods
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return error(401, '未登录或登录已过期', 401);
    }

    const config = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });

    let methods: InterviewMethod[];
    if (config) {
      methods = JSON.parse(config.value);
    } else {
      methods = DEFAULT_METHODS;
      // Save default methods to database
      await prisma.systemConfig.create({
        data: {
          key: CONFIG_KEY,
          value: JSON.stringify(methods),
        },
      });
    }

    // Sort by order
    methods.sort((a, b) => a.order - b.order);

    return success(methods);
  } catch (err) {
    console.error('Get interview methods error:', err);
    return error(500, '获取面试方式失败', 500);
  }
}

// POST - Create a new interview method
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return error(401, '未登录或登录已过期', 401);
    }

    if (user.role !== 'admin' && user.role !== 'hr_manager') {
      return error(403, '无权限创建面试方式', 403);
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return error(422, '面试方式名称不能为空', 422);
    }

    // Get current methods
    const config = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });

    let methods: InterviewMethod[];
    if (config) {
      methods = JSON.parse(config.value);
    } else {
      methods = DEFAULT_METHODS;
    }

    // Generate new ID
    const newId = `method_${Date.now()}`;
    const maxOrder = methods.length > 0 ? Math.max(...methods.map(m => m.order)) : 0;

    const newMethod: InterviewMethod = {
      id: newId,
      name: name.trim(),
      order: maxOrder + 1,
    };

    methods.push(newMethod);

    // Save to database
    await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      create: { key: CONFIG_KEY, value: JSON.stringify(methods) },
      update: { value: JSON.stringify(methods) },
    });

    return success(newMethod, '面试方式创建成功');
  } catch (err) {
    console.error('Create interview method error:', err);
    return error(500, '创建面试方式失败', 500);
  }
}

// PUT - Update an interview method or reorder
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return error(401, '未登录或登录已过期', 401);
    }

    if (user.role !== 'admin' && user.role !== 'hr_manager') {
      return error(403, '无权限更新面试方式', 403);
    }

    const body = await request.json();
    const { id, name, order, methods: newOrder } = body;

    // Get current methods
    const config = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });

    let methods: InterviewMethod[];
    if (config) {
      methods = JSON.parse(config.value);
    } else {
      methods = DEFAULT_METHODS;
    }

    // If reordering (batch update)
    if (newOrder && Array.isArray(newOrder)) {
      methods = newOrder.map((item: { id: string; order: number }) => {
        const existing = methods.find(m => m.id === item.id);
        return {
          id: item.id,
          name: existing?.name || '',
          order: item.order,
        };
      });
    } else if (id) {
      // Update single method
      const index = methods.findIndex(m => m.id === id);
      if (index === -1) {
        return error(404, '面试方式不存在', 404);
      }

      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          return error(422, '面试方式名称不能为空', 422);
        }
        methods[index].name = name.trim();
      }

      if (order !== undefined) {
        methods[index].order = order;
      }
    }

    // Save to database
    await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      create: { key: CONFIG_KEY, value: JSON.stringify(methods) },
      update: { value: JSON.stringify(methods) },
    });

    return success(methods, '面试方式更新成功');
  } catch (err) {
    console.error('Update interview method error:', err);
    return error(500, '更新面试方式失败', 500);
  }
}

// DELETE - Delete an interview method
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return error(401, '未登录或登录已过期', 401);
    }

    if (user.role !== 'admin' && user.role !== 'hr_manager') {
      return error(403, '无权限删除面试方式', 403);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return error(422, '缺少面试方式ID', 422);
    }

    // Get current methods
    const config = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });

    let methods: InterviewMethod[];
    if (config) {
      methods = JSON.parse(config.value);
    } else {
      methods = DEFAULT_METHODS;
    }

    const index = methods.findIndex(m => m.id === id);
    if (index === -1) {
      return error(404, '面试方式不存在', 404);
    }

    methods.splice(index, 1);

    // Save to database
    await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      create: { key: CONFIG_KEY, value: JSON.stringify(methods) },
      update: { value: JSON.stringify(methods) },
    });

    return success(null, '面试方式删除成功');
  } catch (err) {
    console.error('Delete interview method error:', err);
    return error(500, '删除面试方式失败', 500);
  }
}
