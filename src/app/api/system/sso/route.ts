import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, success, unauthorized, badRequest } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// GET /api/system/sso
export async function GET() {
  const user = await requireRole('admin');
  if (!user) return unauthorized();

  const config = await prisma.sSOConfig.findFirst();
  return success(config || {
    enabled: false,
    protocol: 'saml',
    idpUrl: '',
    idpCert: '',
    entityId: '',
    clientId: '',
    clientSecret: '',
    callbackUrl: '',
    autoProvision: true,
    defaultRole: 'interviewer',
  });
}

// PUT /api/system/sso
export async function PUT(request: NextRequest) {
  const admin = await requireRole('admin');
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    const existing = await prisma.sSOConfig.findFirst();

    const config = existing
      ? await prisma.sSOConfig.update({
          where: { id: existing.id },
          data: body,
        })
      : await prisma.sSOConfig.create({ data: body });

    await logAudit({
      userId: admin.userId,
      action: 'update',
      resource: 'sso_config',
      details: { enabled: body.enabled, protocol: body.protocol },
    });

    return success(config);
  } catch (err) {
    console.error('Update SSO config error:', err);
    return badRequest('更新SSO配置失败');
  }
}
