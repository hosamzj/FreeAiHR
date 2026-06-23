import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, badRequest, unauthorized } from '@/lib/auth';

// POST /api/candidates/batch
export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { candidates } = body;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return badRequest('候选人列表不能为空');
    }

    if (candidates.length > 100) {
      return badRequest('单次批量导入不能超过100条');
    }

    const results: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      try {
        // Check duplicate by email
        if (c.email) {
          const existing = await prisma.candidate.findFirst({ where: { email: c.email } });
          if (existing) {
            results.failed++;
            results.errors.push(`${c.name || '未知'}: 邮箱已存在`);
            continue;
          }
        }

        await prisma.candidate.create({
          data: {
            name: c.name || '未知候选人',
            email: c.email || null,
            phone: c.phone || null,
            education: c.education || null,
            school: c.school || null,
            major: c.major || null,
            experience: c.experience || 0,
            currentCompany: c.currentCompany || null,
            currentPosition: c.currentPosition || c.appliedPosition || null,
            skills: JSON.stringify(c.skills || []),
            source: c.source || 'channel',
            status: 'new',
            matchScore: c.matchScore || null,
            aiSummary: c.aiSummary || null,
            appliedPosition: c.appliedPosition || null,
            department: c.department || null,
            tags: JSON.stringify(c.tags || []),
          },
        });
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`${c.name || '未知'}: 创建失败`);
      }
    }

    return success({
      ...results,
      total: candidates.length,
    });
  } catch (err) {
    console.error('Batch create candidates error:', err);
    return badRequest('批量创建候选人失败');
  }
}
