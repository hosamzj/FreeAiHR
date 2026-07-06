import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// GET /api/candidate-pool - 获取候选人池列表
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const skillTag = searchParams.get('skillTag');
    const minExp = searchParams.get('minExp');
    const maxExp = searchParams.get('maxExp');
    const education = searchParams.get('education');
    const location = searchParams.get('location');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (minExp) where.yearsExp = { gte: parseInt(minExp) };
    if (maxExp) where.yearsExp = { ...(where.yearsExp as object || {}), lte: parseInt(maxExp) };
    if (education) where.education = education;
    if (location) where.location = { contains: location };

    const pool = await prisma.candidatePool.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    // Filter by skill tag if specified
    let filtered = pool;
    if (skillTag) {
      filtered = pool.filter(p => {
        const tags = JSON.parse(p.skillTags || '[]');
        return tags.some((t: string) => t.toLowerCase().includes(skillTag.toLowerCase()));
      });
    }

    // Enrich with candidate data
    const enriched = await Promise.all(
      filtered.map(async (p) => {
        const candidate = await prisma.candidate.findUnique({ where: { id: p.candidateId } });
        return {
          ...p,
          skillTags: JSON.parse(p.skillTags || '[]'),
          poolTags: JSON.parse(p.poolTags || '[]'),
          contactHistory: JSON.parse(p.contactHistory || '[]'),
          recommendedFor: JSON.parse(p.recommendedFor || '[]'),
          candidate,
        };
      })
    );

    return success(enriched);
  } catch (e) {
    console.error('Get candidate pool error:', e);
    return error(500, '获取候选人池失败');
  }
}

// POST /api/candidate-pool - 添加到候选人池
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { candidateId, status = 'active', poolTags, notes, skillTags, expectedSalary, location, yearsExp, education } = body;

    if (!candidateId) return error(422, '候选人ID不能为空');

    const pool = await prisma.candidatePool.upsert({
      where: { candidateId },
      update: {
        status,
        poolTags: poolTags ? JSON.stringify(poolTags) : undefined,
        notes,
        skillTags: skillTags ? JSON.stringify(skillTags) : undefined,
        expectedSalary,
        location,
        yearsExp,
        education,
      },
      create: {
        candidateId,
        status,
        poolTags: poolTags ? JSON.stringify(poolTags) : '[]',
        notes,
        skillTags: skillTags ? JSON.stringify(skillTags) : '[]',
        expectedSalary,
        location,
        yearsExp,
        education,
      },
    });

    return success(pool);
  } catch (e) {
    console.error('Add to candidate pool error:', e);
    return error(500, '添加到候选人池失败');
  }
}

// PUT /api/candidate-pool - 更新候选人池记录
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { id, status, poolTags, notes, lastContactType, contactEntry, skillTags } = body;

    if (!id) return error(422, 'ID不能为空');

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (poolTags) updateData.poolTags = JSON.stringify(poolTags);
    if (notes !== undefined) updateData.notes = notes;
    if (skillTags) updateData.skillTags = JSON.stringify(skillTags);
    
    if (lastContactType) {
      updateData.lastContactType = lastContactType;
      updateData.lastContactAt = new Date();
      
      // Add to contact history
      const existing = await prisma.candidatePool.findUnique({ where: { id } });
      if (existing) {
        const history = JSON.parse(existing.contactHistory || '[]');
        history.push({ type: lastContactType, date: new Date().toISOString(), entry: contactEntry || '' });
        updateData.contactHistory = JSON.stringify(history);
      }
    }

    const pool = await prisma.candidatePool.update({
      where: { id },
      data: updateData,
    });

    return success(pool);
  } catch (e) {
    console.error('Update candidate pool error:', e);
    return error(500, '更新候选人池失败');
  }
}

// DELETE /api/candidate-pool - 从候选人池移除
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return error(422, 'ID不能为空');

    await prisma.candidatePool.delete({ where: { id } });
    return success({ id });
  } catch (e) {
    console.error('Delete from candidate pool error:', e);
    return error(500, '从候选人池移除失败');
  }
}
