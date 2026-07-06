import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// GET /api/reports/bottleneck - 卡点分析
export async function GET() {
  try {
    await requireAuth();

    const positions = await prisma.jobPosition.findMany({
      where: { status: 'open' },
      include: {
        candidates: true,
        interviews: true,
      },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const bottlenecks = positions
      .map(pos => {
        const candidates = pos.candidates || [];
        const interviews = pos.interviews || [];
        
        // Check for stalled positions (no activity in 7 days)
        const lastActivity = candidates.length > 0
          ? new Date(Math.max(...candidates.map(c => new Date(c.updatedAt).getTime())))
          : new Date(pos.createdAt);
        
        const isStalled = lastActivity < sevenDaysAgo;
        const daysStalled = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

        // Check for interview bottlenecks
        const pendingInterviews = interviews.filter(i => i.status === 'scheduled').length;
        const pendingFeedback = interviews.filter(i => i.status === 'completed').length;

        return {
          positionId: pos.id,
          title: pos.title,
          department: pos.department,
          isStalled,
          daysStalled,
          totalCandidates: candidates.length,
          pendingInterviews,
          suggestions: [] as string[],
        };
      })
      .filter(p => p.isStalled || p.totalCandidates === 0);

    // Add AI suggestions
    bottlenecks.forEach(b => {
      if (b.totalCandidates === 0) {
        b.suggestions.push('该岗位暂无候选人，建议扩大招聘渠道');
        b.suggestions.push('考虑调整岗位要求或薪资范围');
      }
      if (b.isStalled && b.daysStalled > 7) {
        b.suggestions.push(`已停滞${b.daysStalled}天，建议加急处理`);
        if (b.pendingInterviews > 0) {
          b.suggestions.push('有面试安排待完成，请跟进面试官');
        }
      }
    });

    return success(bottlenecks);
  } catch (e) {
    console.error('Get bottleneck report error:', e);
    return error(500, '获取卡点分析失败');
  }
}
