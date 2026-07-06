import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// GET /api/email-templates - 获取邮件模板列表
export async function GET() {
  try {
    await requireAuth();
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { category: 'asc' },
    });
    return success(templates);
  } catch (e) {
    console.error('Get email templates error:', e);
    return error(500, '获取邮件模板列表失败');
  }
}

// POST /api/email-templates - 创建邮件模板
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { name, displayName, category, subject, body: templateBody, variables } = body;

    if (!name || !displayName || !subject || !templateBody) {
      return error(422, '缺少必要字段');
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        displayName,
        category: category || 'general',
        subject,
        body: templateBody,
        variables: JSON.stringify(variables || []),
      },
    });

    return success(template);
  } catch (e) {
    console.error('Create email template error:', e);
    const errMsg = e instanceof Error ? e.message : '未知错误';
    if (errMsg.includes('Unique constraint')) {
      return error(422, '模板标识已存在');
    }
    return error(500, '创建邮件模板失败');
  }
}

// PUT /api/email-templates - 更新邮件模板
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { id, subject, body: templateBody, variables, enabled } = body;

    if (!id) {
      return error(422, '模板ID不能为空');
    }

    const updateData: Record<string, unknown> = {};
    if (subject !== undefined) updateData.subject = subject;
    if (templateBody !== undefined) updateData.body = templateBody;
    if (variables !== undefined) updateData.variables = JSON.stringify(variables);
    if (enabled !== undefined) updateData.enabled = enabled;

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: updateData,
    });

    return success(template);
  } catch (e) {
    console.error('Update email template error:', e);
    return error(500, '更新邮件模板失败');
  }
}

// DELETE /api/email-templates - 删除邮件模板
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return error(422, '模板ID不能为空');
    }

    await prisma.emailTemplate.delete({ where: { id } });
    return success({ id });
  } catch (e) {
    console.error('Delete email template error:', e);
    return error(500, '删除邮件模板失败');
  }
}
