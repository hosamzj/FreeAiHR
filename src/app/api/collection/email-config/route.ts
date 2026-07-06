import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

const CONFIG_KEY = 'email_config';

// GET - 获取邮箱配置
export async function GET() {
  try {
    await requireAuth();

    const config = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });

    if (!config) {
      return success({
        configs: [],
      });
    }

    try {
      const configs = JSON.parse(config.value);
      return success({ configs });
    } catch {
      return success({ configs: [] });
    }
  } catch (err) {
    console.error('Get email config error:', err);
    return error(500, '获取邮箱配置失败', 500);
  }
}

// POST - 保存邮箱配置
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { email, imapServer, imapPort, authCode, name } = body;

    if (!email || !authCode) {
      return error(422, '请提供邮箱地址和授权码');
    }

    // 获取现有配置
    const existing = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });

    let configs: Array<{
      id: string;
      name: string;
      email: string;
      imapServer: string;
      imapPort: number;
      authCode: string;
      createdAt: string;
    }> = [];

    if (existing) {
      try {
        configs = JSON.parse(existing.value);
      } catch {
        configs = [];
      }
    }

    // 添加新配置
    const newConfig = {
      id: `email_${Date.now()}`,
      name: name || email,
      email,
      imapServer: imapServer || getDefaultImapServer(email),
      imapPort: imapPort || 993,
      authCode,
      createdAt: new Date().toISOString(),
    };

    configs.push(newConfig);

    // 保存配置
    await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      update: { value: JSON.stringify(configs) },
      create: { key: CONFIG_KEY, value: JSON.stringify(configs) },
    });

    return success(newConfig, '邮箱配置保存成功');
  } catch (err) {
    console.error('Save email config error:', err);
    return error(500, '保存邮箱配置失败', 500);
  }
}

// DELETE - 删除邮箱配置
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return error(422, '请提供配置ID');
    }

    const existing = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });

    if (!existing) {
      return error(404, '配置不存在');
    }

    let configs: Array<{ id: string }> = [];
    try {
      configs = JSON.parse(existing.value);
    } catch {
      configs = [];
    }

    const filtered = configs.filter((c) => c.id !== id);

    await prisma.systemConfig.update({
      where: { key: CONFIG_KEY },
      data: { value: JSON.stringify(filtered) },
    });

    return success(null, '邮箱配置删除成功');
  } catch (err) {
    console.error('Delete email config error:', err);
    return error(500, '删除邮箱配置失败', 500);
  }
}

function getDefaultImapServer(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase();
  const servers: Record<string, string> = {
    'qq.com': 'imap.qq.com',
    '163.com': 'imap.163.com',
    '126.com': 'imap.126.com',
    'gmail.com': 'imap.gmail.com',
    'outlook.com': 'outlook.office365.com',
    'hotmail.com': 'outlook.office365.com',
  };
  return servers[domain] || 'imap.example.com';
}
