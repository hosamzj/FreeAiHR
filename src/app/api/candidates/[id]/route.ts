import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, unauthorized, badRequest } from '@/lib/auth';

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

    const candidate = await prisma.candidate.update({
      where: { id },
      data: updateData,
    });

    return success(candidate);
  } catch (err) {
    console.error('Update candidate error:', err);
    return badRequest('更新候选人失败');
  }
}
