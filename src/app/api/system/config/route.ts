import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, success, unauthorized, badRequest } from '@/lib/auth';

// GET /api/system/config
export async function GET() {
  const user = await requireRole('admin');
  if (!user) return unauthorized();

  const configs = await prisma.systemConfig.findMany();
  const configMap: Record<string, string> = {};
  configs.forEach((c) => { configMap[c.key] = c.value; });

  return success({
    companyName: configMap.companyName || 'AI智能招聘',
    logoUrl: configMap.logoUrl || '',
    emailNotification: configMap.emailNotification !== 'false',
    smsNotification: configMap.smsNotification !== 'false',
  });
}

// PUT /api/system/config
export async function PUT(request: NextRequest) {
  const admin = await requireRole('admin');
  if (!admin) return unauthorized();

  try {
    const body = await request.json();

    for (const [key, value] of Object.entries(body)) {
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    return success({ message: '配置已更新' });
  } catch (err) {
    console.error('Update system config error:', err);
    return badRequest('更新配置失败');
  }
}
