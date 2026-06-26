import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// POST /api/candidate-pool/batch - 批量添加到候选人池
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { candidateIds, status = 'active', skillTags, notes } = body;

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return error(422, '候选人ID列表不能为空');
    }

    const results: { candidateId: string; success: boolean; error?: string }[] = [];

    for (const candidateId of candidateIds) {
      try {
        // Verify candidate exists
        const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
        if (!candidate) {
          results.push({ candidateId, success: false, error: '候选人不存在' });
          continue;
        }

        // Upsert into pool
        await prisma.candidatePool.upsert({
          where: { candidateId },
          update: {
            status,
            skillTags: skillTags ? JSON.stringify(skillTags) : undefined,
            notes: notes || undefined,
          },
          create: {
            candidateId,
            status,
            skillTags: skillTags ? JSON.stringify(skillTags) : '[]',
            notes: notes || '',
          },
        });

        results.push({ candidateId, success: true });
      } catch (e) {
        results.push({ candidateId, success: false, error: String(e) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return success({
      total: candidateIds.length,
      successCount,
      failCount,
      results,
    });
  } catch (e) {
    console.error('Batch add to candidate pool error:', e);
    return error(500, '批量添加到候选人池失败');
  }
}
