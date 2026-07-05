import { prisma } from '@/lib/prisma';
import type { SyncResult } from './types';

function extractName(raw: string): string {
  const m = raw?.match(/^([^（(]+)/);
  return m ? m[1].trim() : raw;
}

function extractAge(basicInfo: string): number | null {
  const m = basicInfo.match(/(\d+)岁/);
  return m ? parseInt(m[1]) : null;
}

function extractLocation(basicInfo: string): string | null {
  const m = basicInfo.match(/现居[·\s]*([^|]+)/);
  return m ? m[1].trim() : null;
}

function extractExperience(basicInfo: string): number {
  const m = basicInfo.match(/(\d+)年工作经验/);
  return m ? parseInt(m[1]) : 0;
}

export async function processResumeSheet(name: string, rows: unknown[][]): Promise<SyncResult> {
  try {
    const kv: Record<string, string> = {};
    const scoring: Array<{ dimension: string; score: number; notes: string }> = [];
    const strengths: string[] = [];
    const gaps: string[] = [];
    let overallScore = 0;
    let recommendation = '';

    let mode: 'meta' | 'scoring' | 'conclusion' | 'questions' = 'meta';
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const first = String(row[0] || '').trim();
      if (!first) continue;

      if (first.includes('评分表')) {
        mode = 'scoring';
        continue;
      }
      if (first.includes('分析结论')) {
        mode = 'conclusion';
        continue;
      }
      if (first.includes('面试基本问题')) {
        mode = 'questions';
        continue;
      }
      if (first === '综合匹配度(加权) Weighted Overall') {
        overallScore = parseFloat(String(row[1] || '0')) || 0;
        continue;
      }

      if (mode === 'meta') {
        kv[first] = String(row[1] || '');
      } else if (mode === 'scoring') {
        if (first === '维度 Dimension') continue;
        const dim = first.replace(/^\d+\.\s*/, '');
        const notes = String(row[4] || '');
        const scoreText = String(row[5] || row[3] || '');
        scoring.push({ dimension: dim, score: parseFloat(scoreText) || 0, notes });
      } else if (mode === 'conclusion') {
        if (first.startsWith('✅ 优势')) strengths.push(String(row[1] || ''));
        else if (first.startsWith('⚠️ 差距') || first.startsWith('⚠ 差距')) gaps.push(String(row[1] || ''));
        else if (first.startsWith('📌 录用建议')) recommendation = String(row[1] || '');
      }
    }

    const rawName = kv['姓名 Name'] || name.replace('-简历分析', '');
    const candidateName = extractName(rawName);
    const basicInfo = kv['基本信息'] || '';
    const appliedPosition = kv['期望职位'] || '';
    const expectedSalary = kv['期望月薪'] || kv['期望薪资'] || '';
    const matchedJd = kv['匹配JD Matched JD'] || '';

    const existing = await prisma.candidate.findFirst({
      where: { name: candidateName, appliedPosition, source: 'excel_import' },
      orderBy: { createdAt: 'desc' },
    });

    const candidateData = {
      name: candidateName,
      age: extractAge(basicInfo),
      location: extractLocation(basicInfo),
      experience: extractExperience(basicInfo),
      expectedSalary,
      appliedPosition,
      department: '未分配',
      source: 'excel_import' as const,
      matchScore: Math.round(overallScore),
      resumeParsed: JSON.stringify({
        basicInfo,
        scoring,
        strengths,
        gaps,
        matchedJd,
        recommendation,
      }),
      matchAnalysis: recommendation,
      rawResume: basicInfo,
    };

    const candidate = existing
      ? await prisma.candidate.update({ where: { id: existing.id }, data: candidateData })
      : await prisma.candidate.create({ data: { ...candidateData, email: `${candidateName}@excel.import`, status: 'new' } });

    if (matchedJd) {
      const position = await prisma.jobPosition.findFirst({ where: { sheetId: matchedJd } });
      if (position) {
        const existingApp = await prisma.application.findFirst({
          where: { candidateId: candidate.id, positionId: position.id },
        });
        if (existingApp) {
          await prisma.application.update({
            where: { id: existingApp.id },
            data: { matchScore: candidate.matchScore },
          });
        } else {
          await prisma.application.create({
            data: {
              candidateId: candidate.id,
              positionId: position.id,
              source: 'excel_import',
              matchScore: candidate.matchScore,
            },
          });
        }
      }
    }

    return {
      type: 'resume',
      sheet: name,
      status: 'success',
      id: candidate.id,
      isUpdate: !!existing,
      message: `${existing ? '更新' : '新增'}候选人：${candidateName}`,
    };
  } catch (err) {
    return { type: 'resume', sheet: name, status: 'error', message: (err as Error).message };
  }
}
