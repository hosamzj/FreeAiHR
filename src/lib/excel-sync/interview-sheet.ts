import { prisma } from '@/lib/prisma';
import type { SyncResult } from './types';

export async function processInterviewSheet(name: string, rows: unknown[][]): Promise<SyncResult> {
  try {
    const candidateName = name.split('-')[0];
    const kv: Record<string, string> = {};
    const jdMatch: Array<{ keyword: string; evidence: string; match: string }> = [];
    const strengths: string[] = [];
    const risks: string[] = [];
    const quotes: Array<{ time: string; text: string; tags: string }> = [];
    const followUpQuestions: string[] = [];
    let conclusion = '';
    let recommendation = '';
    let position = '';
    let sourceFile = '';

    if (rows[0] && rows[0][0]) {
      const sourceLine = String(rows[0][0]);
      sourceFile = sourceLine;
      const m = sourceLine.match(/岗位：([^|]+)/);
      if (m) position = m[1].trim();
    }

    let mode: 'profile' | 'jdmatch' | 'strengths' | 'risks' | 'quotes' | 'questions' | 'conclusion' = 'profile';
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const first = String(row[0] || '').trim();
      if (!first) continue;

      if (first.includes('与岗位JD的匹配点')) { mode = 'jdmatch'; continue; }
      if (first.includes('主要优势')) { mode = 'strengths'; continue; }
      if (first.includes('主要风险')) { mode = 'risks'; continue; }
      if (first.includes('面试证据摘录')) { mode = 'quotes'; continue; }
      if (first.includes('建议追问问题')) { mode = 'questions'; continue; }
      if (first.includes('初步岗位匹配结论')) { mode = 'conclusion'; continue; }
      if (first === '维度' || first === '时间戳' || first === 'JD关键词' || /^\d+$/.test(first)) continue;

      if (mode === 'profile') {
        kv[first] = String(row[1] || '');
      } else if (mode === 'jdmatch') {
        jdMatch.push({ keyword: first, evidence: String(row[1] || ''), match: String(row[2] || '') });
      } else if (mode === 'strengths') {
        strengths.push(String(row[1] || ''));
      } else if (mode === 'risks') {
        risks.push(String(row[1] || ''));
      } else if (mode === 'quotes') {
        quotes.push({ time: first, text: String(row[1] || ''), tags: String(row[2] || '') });
      } else if (mode === 'questions') {
        followUpQuestions.push(String(row[1] || ''));
      } else if (mode === 'conclusion') {
        if (first === '总体判断') conclusion = String(row[1] || '');
        else if (first === '建议') recommendation = String(row[1] || '');
      }
    }

    const candidate = await prisma.candidate.findFirst({
      where: { name: candidateName },
      orderBy: { createdAt: 'desc' },
    });
    if (!candidate) {
      return { type: 'interview', sheet: name, status: 'error', message: `未找到候选人：${candidateName}` };
    }

    const existing = await prisma.interviewAnalysis.findFirst({
      where: { candidateId: candidate.id, position },
      orderBy: { createdAt: 'desc' },
    });

    const data = {
      candidateId: candidate.id,
      candidateName,
      position,
      sourceFile,
      basicProfile: JSON.stringify(kv),
      jdMatch: JSON.stringify(jdMatch),
      strengths: JSON.stringify(strengths),
      risks: JSON.stringify(risks),
      quotes: JSON.stringify(quotes),
      followUpQuestions: JSON.stringify(followUpQuestions),
      conclusion,
      recommendation,
    };

    const analysis = existing
      ? await prisma.interviewAnalysis.update({ where: { id: existing.id }, data })
      : await prisma.interviewAnalysis.create({ data });

    return {
      type: 'interview',
      sheet: name,
      status: 'success',
      id: analysis.id,
      isUpdate: !!existing,
      message: `${existing ? '更新' : '新增'}面试分析：${candidateName}`,
    };
  } catch (err) {
    return { type: 'interview', sheet: name, status: 'error', message: (err as Error).message };
  }
}
