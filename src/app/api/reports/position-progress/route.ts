import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// GET /api/reports/position-progress - 岗位维度招聘进展
export async function GET() {
  try {
    await requireAuth();

    const positions = await prisma.jobPosition.findMany({
      include: {
        candidates: {
          include: { candidate: true },
        },
        interviews: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const progress = positions.map(pos => {
      const candidates = pos.candidates || [];
      const totalCandidates = candidates.length;
      const interviewing = candidates.filter(c => ['interview', 'screening'].includes(c.status)).length;
      const offered = candidates.filter(c => c.status === 'offer').length;
      const hired = candidates.filter(c => c.status === 'hired').length;
      const interviews = pos.interviews || [];
      const completedInterviews = interviews.filter(i => i.status === 'completed').length;

      // Calculate average processing time
      const now = new Date();
      const avgDays = candidates.length > 0
        ? Math.round(candidates.reduce((sum, c) => {
            const days = Math.floor((now.getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / candidates.length)
        : 0;

      return {
        positionId: pos.id,
        title: pos.title,
        department: pos.department,
        status: pos.status,
        headcount: pos.headcount,
        totalCandidates,
        interviewing,
        offered,
        hired,
        completedInterviews,
        avgProcessingDays: avgDays,
        progress: pos.headcount > 0 ? Math.round((hired / pos.headcount) * 100) : 0,
      };
    });

    return success(progress);
  } catch (e) {
    console.error('Get position progress error:', e);
    return error(500, '获取岗位进展失败');
  }
}
