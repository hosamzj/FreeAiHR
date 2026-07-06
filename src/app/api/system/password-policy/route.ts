import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, success, unauthorized, badRequest } from '@/lib/auth';

// GET /api/system/password-policy
export async function GET() {
  const user = await requireRole('admin');
  if (!user) return unauthorized();

  const policy = await prisma.passwordPolicy.findFirst();
  return success(policy || {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecial: true,
    expiryDays: 90,
    historyCount: 5,
  });
}

// PUT /api/system/password-policy
export async function PUT(request: NextRequest) {
  const admin = await requireRole('admin');
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    const existing = await prisma.passwordPolicy.findFirst();

    const policy = existing
      ? await prisma.passwordPolicy.update({
          where: { id: existing.id },
          data: body,
        })
      : await prisma.passwordPolicy.create({ data: body });

    return success(policy);
  } catch (err) {
    console.error('Update password policy error:', err);
    return badRequest('更新密码策略失败');
  }
}
