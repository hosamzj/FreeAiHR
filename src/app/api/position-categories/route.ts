import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// GET /api/position-categories - 获取所有岗位类别
export async function GET() {
  try {
    const categories = await prisma.$queryRawUnsafe<{ id: string; name: string; sortOrder: number; createdAt: string; updatedAt: string }[]>(
      `SELECT * FROM "PositionCategory" ORDER BY "sortOrder" ASC`
    );
    return success(categories);
  } catch (e) {
    console.error('Get position categories error:', e);
    return error(500, '获取岗位类别失败');
  }
}

// POST /api/position-categories - 创建岗位类别
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { name, sortOrder } = body;

    if (!name || !name.trim()) {
      return error(422, '类别名称不能为空');
    }

    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "PositionCategory" WHERE name = $1`, name.trim()
    );
    if (existing.length > 0) {
      return error(422, '该类别已存在');
    }

    const result = await prisma.$queryRawUnsafe<{ id: string; name: string; sortOrder: number; createdAt: string; updatedAt: string }[]>(
      `INSERT INTO "PositionCategory" (id, name, "sortOrder", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())
       RETURNING *`,
      name.trim(),
      sortOrder ?? 0
    );

    return success(result[0]);
  } catch (e) {
    console.error('Create position category error:', e);
    return error(500, '创建岗位类别失败');
  }
}

// PUT /api/position-categories - 更新岗位类别
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { id, name, sortOrder } = body;

    if (!id) return error(422, '类别ID不能为空');
    if (!name || !name.trim()) return error(422, '类别名称不能为空');

    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "PositionCategory" WHERE name = $1 AND id != $2`, name.trim(), id
    );
    if (existing.length > 0) {
      return error(422, '该类别名称已存在');
    }

    const setClauses: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    setClauses.push(`name = $${paramIdx++}`);
    params.push(name.trim());

    if (sortOrder !== undefined) {
      setClauses.push(`"sortOrder" = $${paramIdx++}`);
      params.push(sortOrder);
    }

    setClauses.push(`"updatedAt" = NOW()`);
    params.push(id);

    const result = await prisma.$queryRawUnsafe<{ id: string; name: string; sortOrder: number; createdAt: string; updatedAt: string }[]>(
      `UPDATE "PositionCategory" SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      ...params
    );

    if (result.length === 0) {
      return error(404, '类别不存在');
    }

    return success(result[0]);
  } catch (e) {
    console.error('Update position category error:', e);
    return error(500, '更新岗位类别失败');
  }
}

// DELETE /api/position-categories - 删除岗位类别
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return error(422, '类别ID不能为空');

    await prisma.$queryRawUnsafe(
      `DELETE FROM "PositionCategory" WHERE id = $1`, id
    );
    return success({ id });
  } catch (e) {
    console.error('Delete position category error:', e);
    return error(500, '删除岗位类别失败');
  }
}
