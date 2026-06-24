import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// POST /api/candidate-pool/recommend - 根据岗位推荐候选人
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { positionId, skills, experience, limit = 10 } = body;

    if (!positionId) return error(422, '岗位ID不能为空');

    // Get position details
    const position = await prisma.jobPosition.findUnique({ where: { id: positionId } });
    if (!position) return error(404, '岗位不存在');

    // Get active candidates from pool
    const pool = await prisma.candidatePool.findMany({
      where: { status: 'active' },
    });

    // Simple matching algorithm
    const scored = pool.map(p => {
      const candidateSkills = JSON.parse(p.skillTags || '[]') as string[];
      const requiredSkills = skills || [];
      
      let matchScore = 0;
      
      // Skill match
      const skillMatches = requiredSkills.filter((s: string) =>
        candidateSkills.some(cs => cs.toLowerCase().includes(s.toLowerCase()))
      );
      matchScore += (skillMatches.length / Math.max(requiredSkills.length, 1)) * 50;
      
      // Experience match
      if (p.yearsExp && experience) {
        const expDiff = Math.abs(p.yearsExp - experience);
        matchScore += Math.max(0, 30 - expDiff * 5);
      } else {
        matchScore += 15;
      }
      
      // Location match
      if (p.location && position.location) {
        if (p.location.includes(position.location) || position.location.includes(p.location)) {
          matchScore += 20;
        }
      } else {
        matchScore += 10;
      }

      return {
        ...p,
        skillTags: candidateSkills,
        poolTags: JSON.parse(p.poolTags || '[]'),
        contactHistory: JSON.parse(p.contactHistory || '[]'),
        recommendedFor: JSON.parse(p.recommendedFor || '[]'),
        matchScore: Math.round(matchScore),
      };
    });

    // Sort by score and limit
    const recommended = scored
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    // Enrich with candidate data
    const enriched = await Promise.all(
      recommended.map(async (p) => {
        const candidate = await prisma.candidate.findUnique({ where: { id: p.candidateId } });
        return { ...p, candidate };
      })
    );

    return success(enriched);
  } catch (e) {
    console.error('Recommend candidates error:', e);
    return error(500, '推荐候选人失败');
  }
}
