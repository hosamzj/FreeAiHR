import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, unauthorized, badRequest, error } from '@/lib/auth';

// GET /api/candidates/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireAuth();
  if (!user) return unauthorized();

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      interviews: {
        include: {
          interviewer: { select: { name: true } },
          evaluations: true,
        },
        orderBy: { scheduledAt: 'desc' },
      },
      offers: true,
      feedbacks: true,
    },
  });

  if (!candidate) return badRequest('候选人不存在');

  return success({
    ...candidate,
    skills: JSON.parse(candidate.skills || '[]'),
    tags: JSON.parse(candidate.tags || '[]'),
    resumeParsed: JSON.parse(candidate.resumeParsed || '{}'),
  });
}

// PUT /api/candidates/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    const allowedFields = ['name', 'email', 'phone', 'status', 'tags', 'matchScore', 'aiSummary', 'department', 'appliedPosition'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = Array.isArray(body[field]) ? JSON.stringify(body[field]) : body[field];
      }
    }

    // 获取原始候选人信息以检测状态变更
    const originalCandidate = await prisma.candidate.findUnique({ where: { id } });
    const wasNotHired = originalCandidate && originalCandidate.status !== 'hired';
    const isNowHired = updateData.status === 'hired';

    const candidate = await prisma.candidate.update({
      where: { id },
      data: updateData,
    });

    // 如果状态变为hired，自动创建合同
    if (wasNotHired && isNowHired) {
      try {
        const employeeId = `EMP${Date.now().toString().slice(-6)}`;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // 默认1年合同

        await prisma.contract.create({
          data: {
            employeeId,
            employeeName: candidate.name,
            department: candidate.department || '',
            position: candidate.appliedPosition || '',
            contractType: 'regular',
            startDate,
            endDate,
            status: 'pending_sign',
            candidateId: id,
            source: 'recruitment',
          },
        });
      } catch (contractErr) {
        console.error('Auto create contract error:', contractErr);
        // 不阻断主流程，记录错误即可
      }
    }

    return success(candidate);
  } catch (err) {
    console.error('Update candidate error:', err);
    return badRequest('更新候选人失败');
  }
}

// DELETE /api/candidates/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) return error(404, '候选人不存在');

    // 删除关联数据
    await prisma.candidateFeedback.deleteMany({ where: { candidateId: id } });
    await prisma.interview.deleteMany({ where: { candidateId: id } });
    await prisma.offer.deleteMany({ where: { candidateId: id } });
    await prisma.application.deleteMany({ where: { candidateId: id } });

    // 删除候选人
    await prisma.candidate.delete({ where: { id } });

    return success(null, '候选人已删除');
  } catch (err) {
    console.error('Delete candidate error:', err);
    return error(500, '删除候选人失败');
  }
}
