import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  comparePassword,
  generateToken,
  setTokenCookie,
  success,
  unauthorized,
  badRequest,
  hashPassword,
  validatePassword,
} from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return badRequest('请输入邮箱和密码');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return unauthorized('邮箱或密码错误');
    }

    if (user.status === 'disabled') {
      return unauthorized('账号已被禁用，请联系管理员');
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return unauthorized('邮箱或密码错误');
    }

    // Check password expiry
    if (user.passwordChangedAt) {
      const daysSinceChange = Math.floor(
        (Date.now() - new Date(user.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const policy = await prisma.passwordPolicy.findFirst();
      const expiryDays = policy?.expiryDays ?? 90;
      if (daysSinceChange > expiryDays) {
        const token = generateToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
        await setTokenCookie(token);
        return success({
          needPasswordChange: true,
          reason: `密码已${daysSinceChange}天未修改，请修改密码后继续使用`,
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
    await setTokenCookie(token);

    await logAudit({
      userId: user.id,
      action: 'login',
      resource: 'auth',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return success({
      needPasswordChange: false,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    });
  } catch (err) {
    console.error('Login error:', err);
    return badRequest('登录失败，请重试');
  }
}

// POST /api/auth/change-password
export async function PUT(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const currentUser = await getCurrentUser();
    if (!currentUser) return unauthorized();

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return badRequest('请输入旧密码和新密码');
    }

    // Validate new password
    const policy = await prisma.passwordPolicy.findFirst();
    const validation = validatePassword(newPassword, {
      minLength: policy?.minLength ?? 8,
      requireUppercase: policy?.requireUppercase ?? true,
      requireLowercase: policy?.requireLowercase ?? true,
      requireNumbers: policy?.requireNumbers ?? true,
      requireSpecial: policy?.requireSpecial ?? true,
    });

    if (!validation.valid) {
      return badRequest(validation.errors.join('；'));
    }

    const user = await prisma.user.findUnique({ where: { id: currentUser.userId } });
    if (!user) return unauthorized();

    const isValid = await comparePassword(oldPassword, user.password);
    if (!isValid) {
      return badRequest('旧密码错误');
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, passwordChangedAt: new Date() },
    });

    await logAudit({
      userId: user.id,
      action: 'change_password',
      resource: 'auth',
    });

    return success({ message: '密码修改成功' });
  } catch (err) {
    console.error('Change password error:', err);
    return badRequest('修改密码失败');
  }
}
