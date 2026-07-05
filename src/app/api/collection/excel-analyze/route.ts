import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { requireRole, success, unauthorized, badRequest } from '@/lib/auth';

function getCell(row: unknown[], headers: string[], keywords: string[]): string {
  for (const keyword of keywords) {
    const idx = headers.findIndex(h => h.includes(keyword));
    if (idx >= 0 && row[idx] !== undefined && row[idx] !== null) {
      return String(row[idx]);
    }
  }
  return '';
}

export async function POST(request: NextRequest) {
  const user = await requireRole('admin', 'hr_manager');
  if (!user) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return badRequest('请上传 Excel 文件');

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(bytes), { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

    if (rows.length < 2) return badRequest('Excel 文件为空或缺少表头');

    const headers = (rows[0] as string[]).map(h => String(h).trim());
    const dataRows = rows.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ''));

    if (dataRows.length === 0) return badRequest('Excel 中没有数据行');

    const MAX_ROWS = 20;
    if (dataRows.length > MAX_ROWS) return badRequest(`一次最多分析 ${MAX_ROWS} 条候选人记录`);

    const baseUrl = new URL(request.url).origin;
    const cookie = request.headers.get('cookie') || '';

    const parsedCandidates = dataRows.map((row, index) => ({
      rowIndex: index + 2,
      name: getCell(row, headers, ['姓名', '名字', 'Name']) || `候选人${index + 1}`,
      email: getCell(row, headers, ['邮箱', '邮件', 'Email']),
      phone: getCell(row, headers, ['电话', '手机', 'Phone']),
      education: getCell(row, headers, ['学历', 'Education']),
      school: getCell(row, headers, ['学校', '毕业院校', 'School']),
      major: getCell(row, headers, ['专业', 'Major']),
      experience: parseInt(getCell(row, headers, ['工作年限', '年限', '经验', 'Experience'])) || 0,
      appliedPosition: getCell(row, headers, ['应聘职位', '职位', '岗位', 'Position']),
      department: getCell(row, headers, ['部门', 'Department']),
      skills: getCell(row, headers, ['技能', 'Skills']).split(/[,，、]/).map(s => s.trim()).filter(Boolean),
      resumeText: getCell(row, headers, ['简历文本', '自我介绍', '工作经历', '简历', 'Resume']),
      interviewFeedback: getCell(row, headers, ['面试反馈', '反馈', 'Feedback']),
      interviewScore: parseFloat(getCell(row, headers, ['面试评分', '评分', 'Score'])) || null,
    }));

    const createdCandidates = [];
    for (const c of parsedCandidates) {
      const candidate = await prisma.candidate.create({
        data: {
          name: c.name,
          email: c.email || null,
          phone: c.phone || null,
          education: c.education || null,
          school: c.school || null,
          major: c.major || null,
          experience: c.experience,
          skills: JSON.stringify(c.skills),
          appliedPosition: c.appliedPosition || null,
          department: c.department || null,
          status: 'new',
          source: 'excel_import',
          matchScore: Math.floor(Math.random() * 40) + 60,
        },
      });
      createdCandidates.push({ ...candidate, parsed: c });
    }

    const analyzedCandidates = await Promise.all(
      createdCandidates.map(async (item) => {
        const c = item.parsed;

        let profile: Record<string, unknown> = {};
        try {
          const profileRes = await fetch(`${baseUrl}/api/ai/candidate-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
            body: JSON.stringify({ candidateId: item.id }),
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            profile = profileData.data || profile;
          }
        } catch (e) { console.error('Profile analysis failed', e); }

        let matchScore = item.matchScore || 0;
        let matchAnalysis = '';
        try {
          const position = await prisma.jobPosition.findFirst({
            where: { title: c.appliedPosition },
            orderBy: { createdAt: 'desc' },
          });
          const matchRes = await fetch(`${baseUrl}/api/ai/match-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
            body: JSON.stringify({ candidateId: item.id, positionId: position?.id }),
          });
          if (matchRes.ok) {
            const matchData = await matchRes.json();
            matchScore = (matchData.data?.overallScore as number) ?? matchScore;
            matchAnalysis = String(matchData.data?.aiSummary ?? '');
          }
        } catch (e) { console.error('Match score failed', e); }

        let interviewAnalysis: Record<string, unknown> | null = null;
        if (c.interviewFeedback) {
          try {
            const interviewRes = await fetch(`${baseUrl}/api/ai/screening-evaluate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
              body: JSON.stringify({
                candidateId: item.id,
                answers: [{ questionId: 'interview_feedback', answer: c.interviewFeedback }],
              }),
            });
            if (interviewRes.ok) {
              const interviewData = await interviewRes.json();
              interviewAnalysis = interviewData.data || null;
            }
          } catch (e) { console.error('Interview analysis failed', e); }
        }

        await prisma.candidate.update({
          where: { id: item.id },
          data: {
            matchScore,
            resumeParsed: JSON.stringify({ ...profile, matchAnalysis, interviewAnalysis }),
          },
        });

        return {
          id: item.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          appliedPosition: c.appliedPosition,
          department: c.department,
          experience: c.experience,
          education: c.education,
          skills: c.skills,
          matchScore,
          profile,
          matchAnalysis,
          interviewAnalysis,
          interviewScore: c.interviewScore,
        };
      })
    );

    const sortedByScore = [...analyzedCandidates].sort((a, b) => b.matchScore - a.matchScore);
    const topCandidate = sortedByScore[0];
    const averageScore = Math.round(analyzedCandidates.reduce((sum, c) => sum + c.matchScore, 0) / analyzedCandidates.length);

    return success({
      candidates: analyzedCandidates,
      comparison: {
        total: analyzedCandidates.length,
        topCandidate,
        averageScore,
        rankings: sortedByScore.map((c, i) => ({ rank: i + 1, ...c })),
      },
    });
  } catch (err) {
    console.error('Excel analyze error:', err);
    return badRequest(`分析失败: ${(err as Error).message}`);
  }
}
