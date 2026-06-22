import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/auth';

// POST /api/auth/sms/send
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return badRequest('请输入有效的手机号码');
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to database
    const { prisma } = await import('@/lib/prisma');
    await prisma.smsCode.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    // Log the code (simulating SMS gateway)
    console.log(`[SMS] 验证码发送至 ${phone}: ${code}`);

    return success({ message: '验证码已发送，请查看手机短信' });
  } catch (err) {
    console.error('Send SMS error:', err);
    return badRequest('发送验证码失败');
  }
}

// POST /api/auth/sms/verify
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return badRequest('请输入手机号和验证码');
    }

    const { prisma } = await import('@/lib/prisma');
    const smsCode = await prisma.smsCode.findFirst({
      where: {
        phone,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!smsCode) {
      return badRequest('验证码无效或已过期');
    }

    // Mark as used
    await prisma.smsCode.update({
      where: { id: smsCode.id },
      data: { used: true },
    });

    return success({ verified: true, message: '验证成功' });
  } catch (err) {
    console.error('Verify SMS error:', err);
    return badRequest('验证失败');
  }
}
