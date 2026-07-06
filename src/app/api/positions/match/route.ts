import { NextRequest } from 'next/server';
import { requireAuth, success, error, unauthorized, badRequest, serverError } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callLLM } from '@/lib/ai';

// POST /api/positions/match - Match candidate with position JD
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  try {
    const body = await req.json();
    const { candidateId, positionId } = body;

    if (!candidateId || !positionId) return badRequest('缺少候选人ID或岗位ID');

    // Get candidate
    const candidates = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT * FROM "Candidate" WHERE "id" = $1`, candidateId
    );
    if (!candidates.length) return badRequest('候选人不存在');
    const candidate = candidates[0];

    // Get position
    const positions = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT * FROM "Position" WHERE "id" = $1`, positionId
    );
    if (!positions.length) return badRequest('岗位不存在');
    const position = positions[0];

    // Build candidate profile
    const candidateProfile = {
      name: candidate.name || '',
      education: candidate.education || '',
      skills: candidate.skills || '',
      workExperience: candidate.workExperience || '',
      certificates: candidate.certificates || '',
      summary: candidate.summary || '',
    };

    // Build position JD
    const positionJD = {
      title: position.title || '',
      department: position.department || '',
      description: position.description || '',
      requirements: position.requirements || '[]',
      niceToHave: position.niceToHave || '[]',
    };

    // Call LLM for matching
    const prompt = `你是一位专业的招聘匹配评估专家。请根据以下候选人简历和岗位JD，评估候选人与岗位的匹配度。

## 岗位JD
- 职位名称：${positionJD.title}
- 所属部门：${positionJD.department}
- 岗位职责：${positionJD.description}
- 任职要求：${positionJD.requirements}
- 加分项：${positionJD.niceToHave}

## 候选人简历
- 姓名：${candidateProfile.name}
- 学历：${candidateProfile.education}
- 技能：${candidateProfile.skills}
- 工作经历：${candidateProfile.workExperience}
- 证书：${candidateProfile.certificates}
- 个人总结：${candidateProfile.summary}

请从以下维度评估匹配度（每项0-20分，总分100分）：
1. 学历匹配度
2. 技能匹配度
3. 工作经验匹配度
4. 证书/资质匹配度
5. 综合匹配度

请以JSON格式返回，格式如下：
{
  "totalScore": 85,
  "dimensions": {
    "education": 18,
    "skills": 16,
    "experience": 17,
    "certificates": 15,
    "overall": 19
  },
  "summary": "综合评价...",
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["不足1"],
  "recommendation": "推荐面试" // 强烈推荐/推荐面试/可考虑/不推荐
}`;

    const result = await callLLM(prompt, { temperature: 0.3, maxTokens: 1000 });
    let matchResult;
    try {
      // Extract JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      matchResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { totalScore: 0, summary: '匹配评估失败' };
    } catch {
      matchResult = { totalScore: 0, summary: '匹配评估解析失败' };
    }

    const totalScore = matchResult.totalScore || 0;

    // Upsert CandidatePosition
    const existing = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT "id" FROM "CandidatePosition" WHERE "candidateId" = $1 AND "positionId" = $2`,
      candidateId, positionId
    );

    if (existing.length > 0) {
      await prisma.$queryRawUnsafe(
        `UPDATE "CandidatePosition" SET "matchScore" = $1, "matchDetail" = $2, "updatedAt" = NOW() WHERE "candidateId" = $3 AND "positionId" = $4`,
        totalScore, JSON.stringify(matchResult), candidateId, positionId
      );
    } else {
      const cpId = `cp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await prisma.$queryRawUnsafe(
        `INSERT INTO "CandidatePosition" ("id", "candidateId", "positionId", "matchScore", "matchDetail", "status")
         VALUES ($1, $2, $3, $4, $5, 'matched')`,
        cpId, candidateId, positionId, totalScore, JSON.stringify(matchResult)
      );
    }

    return success({
      candidateId,
      positionId,
      matchScore: totalScore,
      matchDetail: matchResult,
    });
  } catch (e) {
    console.error('POST /api/positions/match error:', e);
    return serverError();
  }
}
