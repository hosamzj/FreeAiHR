import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// GET /api/industries - 获取所有行业类型
export async function GET() {
  try {
    const industries = await prisma.$queryRawUnsafe<{ id: string; name: string; sortOrder: number; createdAt: string; updatedAt: string }[]>(
      `SELECT * FROM "Industry" ORDER BY "sortOrder" ASC`
    );
    return success(industries);
  } catch (e) {
    console.error('Get industries error:', e);
    return error(500, '获取行业类型失败');
  }
}

// POST /api/industries - 创建行业类型
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { name, sortOrder } = body;

    if (!name || !name.trim()) {
      return error(422, '行业名称不能为空');
    }

    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "Industry" WHERE name = $1`, name.trim()
    );
    if (existing.length > 0) {
      return error(422, '该行业已存在');
    }

    const result = await prisma.$queryRawUnsafe<{ id: string; name: string; sortOrder: number; createdAt: string; updatedAt: string }[]>(
      `INSERT INTO "Industry" (id, name, "sortOrder", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())
       RETURNING *`,
      name.trim(),
      sortOrder ?? 0
    );

    return success(result[0]);
  } catch (e) {
    console.error('Create industry error:', e);
    return error(500, '创建行业类型失败');
  }
}

// PUT /api/industries - 更新行业类型
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { id, name, sortOrder } = body;

    if (!id) return error(422, '行业ID不能为空');
    if (!name || !name.trim()) return error(422, '行业名称不能为空');

    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "Industry" WHERE name = $1 AND id != $2`, name.trim(), id
    );
    if (existing.length > 0) {
      return error(422, '该行业名称已存在');
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
      `UPDATE "Industry" SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      ...params
    );

    if (result.length === 0) {
      return error(404, '行业不存在');
    }

    return success(result[0]);
  } catch (e) {
    console.error('Update industry error:', e);
    return error(500, '更新行业类型失败');
  }
}

// DELETE /api/industries - 删除行业类型
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return error(422, '行业ID不能为空');

    await prisma.$queryRawUnsafe(
      `DELETE FROM "Industry" WHERE id = $1`, id
    );
    return success({ id });
  } catch (e) {
    console.error('Delete industry error:', e);
    return error(500, '删除行业类型失败');
  }
}
