import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, unauthorized, badRequest } from '@/lib/auth';

// GET /api/offers
export async function GET(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || '';

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const offers = await prisma.offer.findMany({
    where,
    include: {
      candidate: { select: { id: true, name: true, appliedPosition: true } },
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return success(offers);
}

// POST /api/offers
export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { candidateId, positionId, salaryBase, salaryBonus, salaryStock, startDate, benefits } = body;

    if (!candidateId) return badRequest('请选择候选人');

    const offer = await prisma.offer.create({
      data: {
        candidateId,
        positionId: positionId || null,
        creatorId: user.userId,
        salaryBase: salaryBase || null,
        salaryBonus: salaryBonus || null,
        salaryStock: salaryStock || null,
        startDate: startDate ? new Date(startDate) : null,
        benefits: benefits ? JSON.stringify(benefits) : null,
        status: 'draft',
      },
      include: {
        candidate: { select: { name: true, appliedPosition: true } },
      },
    });

    return success(offer);
  } catch (err) {
    console.error('Create offer error:', err);
    return badRequest('创建Offer失败');
  }
}
