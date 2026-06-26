import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, success, error, unauthorized, forbidden, badRequest, serverError } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/positions - List positions
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'open';

  try {
    let where = '';
    if (status !== 'all') {
      where = `WHERE "status" = '${status}'`;
    }
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT * FROM "Position" ${where} ORDER BY "createdAt" DESC`
    );
    return success(rows);
  } catch (e) {
    console.error('GET /api/positions error:', e);
    return serverError();
  }
}

// POST /api/positions - Create position
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  try {
    const body = await req.json();
    const { title, department, category, industry, location, headcount, salaryMin, salaryMax, description, requirements, niceToHave, templateId } = body;

    if (!title) return badRequest('岗位名称不能为空');

    const id = `pos_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await prisma.$queryRawUnsafe(
      `INSERT INTO "Position" ("id", "title", "department", "category", "industry", "location", "headcount", "salaryMin", "salaryMax", "description", "requirements", "niceToHave", "templateId", "createdBy")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      id, title, department || null, category || null, industry || null, location || null,
      headcount || 1, salaryMin || null, salaryMax || null,
      description || '', JSON.stringify(requirements || []), JSON.stringify(niceToHave || []),
      templateId || null, auth.userId
    );

    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT * FROM "Position" WHERE "id" = $1`, id
    );
    return success(rows[0] || null);
  } catch (e) {
    console.error('POST /api/positions error:', e);
    return serverError();
  }
}

// PUT /api/positions - Update position
export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  try {
    const body = await req.json();
    const { id, title, department, category, industry, location, headcount, salaryMin, salaryMax, description, requirements, niceToHave, status } = body;

    if (!id) return badRequest('缺少岗位ID');

    // Check ownership or admin
    const existing = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT * FROM "Position" WHERE "id" = $1`, id
    );
    if (!existing.length) return badRequest('岗位不存在');

    const adminCheck = await requireRole('admin');
    if (!adminCheck && (existing[0].createdBy as string) !== auth.userId) {
      return forbidden('只能编辑自己创建的岗位');
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    const fields: Record<string, unknown> = { title, department, category, industry, location, headcount, salaryMin, salaryMax, description, status };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) {
        updates.push(`"${key}" = $${paramIdx++}`);
        values.push(val);
      }
    }
    if (requirements !== undefined) {
      updates.push(`"requirements" = $${paramIdx++}`);
      values.push(JSON.stringify(requirements));
    }
    if (niceToHave !== undefined) {
      updates.push(`"niceToHave" = $${paramIdx++}`);
      values.push(JSON.stringify(niceToHave));
    }

    if (updates.length > 0) {
      updates.push(`"updatedAt" = NOW()`);
      values.push(id);
      await prisma.$queryRawUnsafe(
        `UPDATE "Position" SET ${updates.join(', ')} WHERE "id" = $${paramIdx}`,
        ...values
      );
    }

    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT * FROM "Position" WHERE "id" = $1`, id
    );
    return success(rows[0] || null);
  } catch (e) {
    console.error('PUT /api/positions error:', e);
    return serverError();
  }
}

// DELETE /api/positions - Delete position
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return badRequest('缺少岗位ID');

    const adminCheck = await requireRole('admin');
    if (!adminCheck) return forbidden('仅管理员可删除岗位');

    await prisma.$queryRawUnsafe(`DELETE FROM "Position" WHERE "id" = $1`, id);
    return success(null, '删除成功');
  } catch (e) {
    console.error('DELETE /api/positions error:', e);
    return serverError();
  }
}
