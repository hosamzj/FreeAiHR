import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, success, unauthorized, badRequest, hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// GET /api/users/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await requireRole('admin', 'hr_manager');
  if (!currentUser) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, phone: true, name: true, avatar: true,
      role: true, department: true, position: true, status: true,
      lastLoginAt: true, createdAt: true,
    },
  });

  if (!user) return badRequest('用户不存在');
  return success(user);
}

// PUT /api/users/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await requireRole('admin');
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    const { name, email, phone, role, department, position, status } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (position !== undefined) updateData.position = position;
    if (status !== undefined) updateData.status = status;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, email: true, phone: true, name: true,
        role: true, department: true, position: true, status: true,
      },
    });

    await logAudit({
      userId: admin.userId,
      action: 'update',
      resource: 'user',
      resourceId: id,
      details: updateData,
    });

    return success(user);
  } catch (err) {
    console.error('Update user error:', err);
    return badRequest('更新用户失败');
  }
}

// DELETE /api/users/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await requireRole('admin');
  if (!admin) return unauthorized();

  await prisma.user.delete({ where: { id } });

  await logAudit({
    userId: admin.userId,
    action: 'delete',
    resource: 'user',
    resourceId: id,
  });

  return success({ message: '用户已删除' });
}
