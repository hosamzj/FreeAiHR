import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// GET /api/reports/funnel - 招聘漏斗数据
export async function GET() {
  try {
    await requireAuth();

    // Count candidates at each stage
    const totalCandidates = await prisma.candidate.count();
    const screening = await prisma.candidate.count({ where: { status: { in: ['screening', 'interviewing', 'offered', 'hired'] } } });
    const interviewing = await prisma.candidate.count({ where: { status: { in: ['interviewing', 'offered', 'hired'] } } });
    const offered = await prisma.candidate.count({ where: { status: { in: ['offered', 'hired'] } } });
    const hired = await prisma.candidate.count({ where: { status: 'hired' } });

    const funnel = [
      { stage: 'resume', label: '简历收集', count: totalCandidates, rate: 100 },
      { stage: 'screening', label: '简历筛选', count: screening, rate: totalCandidates > 0 ? Math.round((screening / totalCandidates) * 100) : 0 },
      { stage: 'interview', label: '面试', count: interviewing, rate: screening > 0 ? Math.round((interviewing / screening) * 100) : 0 },
      { stage: 'offer', label: 'Offer', count: offered, rate: interviewing > 0 ? Math.round((offered / interviewing) * 100) : 0 },
      { stage: 'hired', label: '入职', count: hired, rate: offered > 0 ? Math.round((hired / offered) * 100) : 0 },
    ];

    return success({ funnel, total: totalCandidates });
  } catch (e) {
    console.error('Get funnel report error:', e);
    return error(500, '获取招聘漏斗数据失败');
  }
}
