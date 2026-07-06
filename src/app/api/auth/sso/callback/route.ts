import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, unauthorized, badRequest, serverError } from '@/lib/auth';

// GET /api/auth/sso/callback - SSO callback handler
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return badRequest('SSO回调参数缺失');
    }

    // Get SSO config
    const ssoConfig = await prisma.sSOConfig.findFirst();
    if (!ssoConfig || !ssoConfig.enabled) {
      return badRequest('SSO未启用');
    }

    // In production, this would validate the code with the IdP
    // For now, simulate SSO user info
    const ssoUserInfo = {
      email: `sso_user_${code.substring(0, 6)}@company.com`,
      name: `SSO用户-${code.substring(0, 4)}`,
    };

    // Auto-provision user if not exists
    let user = await prisma.user.findUnique({ where: { email: ssoUserInfo.email } });
    if (!user && ssoConfig.autoProvision) {
      const { hashPassword } = await import('@/lib/auth');
      const randomPassword = await hashPassword(Math.random().toString(36).slice(-16));
      user = await prisma.user.create({
        data: {
          email: ssoUserInfo.email,
          name: ssoUserInfo.name,
          password: randomPassword,
          role: ssoConfig.defaultRole,
          passwordChangedAt: new Date(),
        },
      });
    }

    if (!user) {
      return unauthorized('SSO用户不存在');
    }

    if (user.status === 'disabled') {
      return unauthorized('账号已被禁用');
    }

    // Generate token and set cookie
    const { generateToken, setTokenCookie } = await import('@/lib/auth');
    const token = generateToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
    await setTokenCookie(token);

    // Redirect to dashboard
    return new Response(null, {
      status: 302,
      headers: { Location: '/dashboard' },
    });
  } catch (err) {
    console.error('SSO callback error:', err);
    return serverError('SSO登录失败');
  }
}
