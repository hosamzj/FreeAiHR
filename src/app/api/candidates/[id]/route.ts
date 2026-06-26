import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, success, unauthorized, forbidden, badRequest } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();
  const roleCheck = await requireRole('admin', 'hr_manager');
  if (!roleCheck) return forbidden();

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!status || !['pool', 'new', 'contacted', 'interviewing', 'offered', 'rejected'].includes(status)) {
    return badRequest('无效的状态值');
  }

  const candidate = await prisma.candidate.update({
    where: { id },
    data: { status },
  });

  return success(candidate);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();
  const roleCheck = await requireRole('admin', 'hr_manager');
  if (!roleCheck) return forbidden();

  const { id } = await params;

  await prisma.candidate.delete({ where: { id } });

  return success(null, '删除成功');
}
