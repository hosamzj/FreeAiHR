import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, unauthorized, badRequest } from '@/lib/auth';

// GET /api/offers/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireAuth();
  if (!user) return unauthorized();

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      candidate: { select: { id: true, name: true, appliedPosition: true, email: true } },
      creator: { select: { name: true } },
    },
  });

  if (!offer) return badRequest('Offer不存在');
  return success({ ...offer, benefits: offer.benefits ? JSON.parse(offer.benefits) : null });
}

// PUT /api/offers/[id]
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

    if (body.status) updateData.status = body.status;
    if (body.salaryBase !== undefined) updateData.salaryBase = body.salaryBase;
    if (body.salaryBonus !== undefined) updateData.salaryBonus = body.salaryBonus;
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.benefits) updateData.benefits = JSON.stringify(body.benefits);
    if (body.approvalNotes) updateData.approvalNotes = body.approvalNotes;

    if (body.status === 'approved') {
      updateData.approvedBy = user.userId;
      updateData.approvedAt = new Date();
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: updateData,
    });

    return success(offer);
  } catch (err) {
    console.error('Update offer error:', err);
    return badRequest('更新Offer失败');
  }
}
