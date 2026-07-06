import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, success, unauthorized, forbidden, badRequest, hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// GET /api/users - List users (admin only)
export async function GET(request: NextRequest) {
  const user = await requireRole('admin');
  if (!user) return unauthorized();

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const status = searchParams.get('status') || '';

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }
  if (role) where.role = role;
  if (status) where.status = status;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, phone: true, name: true, avatar: true,
        role: true, department: true, position: true, status: true,
        lastLoginAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return success({ users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

// POST /api/users - Create user (admin only)
export async function POST(request: NextRequest) {
  const admin = await requireRole('admin');
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    const { email, phone, name, password, role, department, position } = body;

    if (!email || !name || !password) {
      return badRequest('请填写必要信息（邮箱、姓名、密码）');
    }

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return badRequest('该邮箱已被注册');
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        email,
        phone: phone || null,
        name,
        password: hashedPassword,
        role: role || 'interviewer',
        department: department || null,
        position: position || null,
        passwordChangedAt: new Date(),
      },
      select: {
        id: true, email: true, phone: true, name: true,
        role: true, department: true, position: true, status: true, createdAt: true,
      },
    });

    await logAudit({
      userId: admin.userId,
      action: 'create',
      resource: 'user',
      resourceId: newUser.id,
      details: { email, name, role },
    });

    return success(newUser);
  } catch (err) {
    console.error('Create user error:', err);
    return badRequest('创建用户失败');
  }
}
