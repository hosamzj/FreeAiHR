import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// POST - 检查候选人重复
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { email, phone, name, company } = body;

    if (!email && !phone && !name) {
      return error(422, '请提供至少一个检查字段（邮箱/手机/姓名）');
    }

    const duplicates: Array<{
      type: string;
      field: string;
      value: string;
      candidate: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        currentCompany: string | null;
        status: string;
      };
    }> = [];

    // 检查邮箱重复
    if (email) {
      const existingByEmail = await prisma.candidate.findFirst({
        where: { email: { equals: email } },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          currentCompany: true,
          status: true,
        },
      });
      if (existingByEmail) {
        duplicates.push({
          type: 'email',
          field: '邮箱',
          value: email,
          candidate: existingByEmail,
        });
      }
    }

    // 检查手机重复
    if (phone) {
      const existingByPhone = await prisma.candidate.findFirst({
        where: { phone: { equals: phone } },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          currentCompany: true,
          status: true,
        },
      });
      if (existingByPhone) {
        duplicates.push({
          type: 'phone',
          field: '手机号',
          value: phone,
          candidate: existingByPhone,
        });
      }
    }

    // 检查姓名+公司组合重复
    if (name && company) {
      const existingByNameCompany = await prisma.candidate.findFirst({
        where: {
          name: { equals: name },
          currentCompany: { equals: company },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          currentCompany: true,
          status: true,
        },
      });
      if (existingByNameCompany) {
        duplicates.push({
          type: 'name_company',
          field: '姓名+公司',
          value: `${name} @ ${company}`,
          candidate: existingByNameCompany,
        });
      }
    }

    return success({
      hasDuplicate: duplicates.length > 0,
      duplicates,
      message: duplicates.length > 0 
        ? `发现 ${duplicates.length} 条重复记录` 
        : '未发现重复记录',
    });
  } catch (err) {
    console.error('Check duplicate error:', err);
    return error(500, '检查重复失败', 500);
  }
}
