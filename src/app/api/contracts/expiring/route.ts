import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// GET /api/contracts/expiring - 获取即将到期的合同
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90');

    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const contracts = await prisma.contract.findMany({
      where: {
        status: { in: ['active', 'expiring'] },
        endDate: { lte: futureDate, gte: now },
      },
      orderBy: { endDate: 'asc' },
    });

    // Categorize by urgency
    const categorized = {
      urgent: contracts.filter(c => {
        const daysLeft = Math.floor((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 30;
      }),
      warning: contracts.filter(c => {
        const daysLeft = Math.floor((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft > 30 && daysLeft <= 60;
      }),
      normal: contracts.filter(c => {
        const daysLeft = Math.floor((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft > 60;
      }),
    };

    // Add days left calculation
    const enrich = (list: typeof contracts) => list.map(c => ({
      ...c,
      daysLeft: Math.floor((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));

    return success({
      urgent: enrich(categorized.urgent),
      warning: enrich(categorized.warning),
      normal: enrich(categorized.normal),
      total: contracts.length,
    });
  } catch (e) {
    console.error('Get expiring contracts error:', e);
    return error(500, '获取到期合同失败');
  }
}
