import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';

interface DictRow {
  id: string;
  groupKey: string;
  value: string;
  sortOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// GET /api/system/dictionary?groupKey=category
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ code: 401, message: '未登录' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const groupKey = searchParams.get('groupKey');

    let items: DictRow[];
    if (groupKey) {
      items = await prisma.$queryRawUnsafe<DictRow[]>(
        `SELECT * FROM "Dictionary" WHERE "groupKey" = $1 AND "enabled" = true ORDER BY "sortOrder" ASC`,
        groupKey
      );
    } else {
      items = await prisma.$queryRawUnsafe<DictRow[]>(
        `SELECT * FROM "Dictionary" WHERE "enabled" = true ORDER BY "groupKey" ASC, "sortOrder" ASC`
      );
    }

    return NextResponse.json({ code: 0, data: items, message: 'success' });
  } catch (error) {
    console.error('GET /api/system/dictionary error:', error);
    return NextResponse.json({ code: 500, message: '服务器错误' }, { status: 500 });
  }
}

// POST /api/system/dictionary
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ code: 401, message: '未登录' }, { status: 401 });
    const adminUser = await requireRole('admin');
    if (!adminUser) return NextResponse.json({ code: 403, message: '无权限' }, { status: 403 });

    const body = await request.json();
    const { groupKey, value, sortOrder } = body;

    if (!groupKey || !value) {
      return NextResponse.json({ code: 422, message: 'groupKey 和 value 为必填项' }, { status: 422 });
    }

    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Dictionary" ("id", "groupKey", "value", "sortOrder") VALUES ($1, $2, $3, $4)`,
      id, groupKey, value, sortOrder ?? 0
    );

    const [item] = await prisma.$queryRawUnsafe<DictRow[]>(
      `SELECT * FROM "Dictionary" WHERE "id" = $1`, id
    );

    return NextResponse.json({ code: 0, data: item, message: 'success' });
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE constraint')) {
      return NextResponse.json({ code: 422, message: '该条目已存在' }, { status: 422 });
    }
    console.error('POST /api/system/dictionary error:', error);
    return NextResponse.json({ code: 500, message: '服务器错误' }, { status: 500 });
  }
}

// PUT /api/system/dictionary
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ code: 401, message: '未登录' }, { status: 401 });
    const adminUser = await requireRole('admin');
    if (!adminUser) return NextResponse.json({ code: 403, message: '无权限' }, { status: 403 });

    const body = await request.json();
    const { id, value, sortOrder, enabled } = body;

    if (!id) {
      return NextResponse.json({ code: 422, message: 'id 为必填项' }, { status: 422 });
    }

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (value !== undefined) {
      setClauses.push(`"value" = $${paramIdx++}`);
      params.push(value);
    }
    if (sortOrder !== undefined) {
      setClauses.push(`"sortOrder" = $${paramIdx++}`);
      params.push(sortOrder);
    }
    if (enabled !== undefined) {
      setClauses.push(`"enabled" = $${paramIdx++}`);
      params.push(enabled);
    }

    if (setClauses.length > 0) {
      params.push(id);
      await prisma.$executeRawUnsafe(
        `UPDATE "Dictionary" SET ${setClauses.join(', ')} WHERE "id" = $${paramIdx}`,
        ...params
      );
    }

    const [item] = await prisma.$queryRawUnsafe<DictRow[]>(
      `SELECT * FROM "Dictionary" WHERE "id" = $1`, id
    );

    return NextResponse.json({ code: 0, data: item, message: 'success' });
  } catch (error) {
    console.error('PUT /api/system/dictionary error:', error);
    return NextResponse.json({ code: 500, message: '服务器错误' }, { status: 500 });
  }
}

// DELETE /api/system/dictionary?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ code: 401, message: '未登录' }, { status: 401 });
    const adminUser = await requireRole('admin');
    if (!adminUser) return NextResponse.json({ code: 403, message: '无权限' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ code: 422, message: 'id 为必填项' }, { status: 422 });
    }

    await prisma.$executeRawUnsafe(`DELETE FROM "Dictionary" WHERE "id" = $1`, id);

    return NextResponse.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('DELETE /api/system/dictionary error:', error);
    return NextResponse.json({ code: 500, message: '服务器错误' }, { status: 500 });
  }
}
