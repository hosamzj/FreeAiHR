import { prisma } from '@/lib/prisma';
import type { SyncResult } from './types';

export async function processComparisonSheet(name: string, rows: unknown[][]): Promise<SyncResult> {
  try {
    const title = String(rows[0]?.[0] || name);
    const targetJdMatch = title.match(/JD-([^ ]+)/);
    const targetJd = targetJdMatch ? `JD-${targetJdMatch[1]}` : null;
    let targetJdId: string | null = null;

    if (targetJd) {
      const position = await prisma.jobPosition.findFirst({ where: { sheetId: targetJd } });
      targetJdId = position?.id || null;
    }

    const header = rows[2] as string[];
    const candidateNames = header.slice(2);
    const dimensions: Array<{ dimension: string; weight: number; scores: Record<string, number> }> = [];
    const candidateScores: Record<string, number> = {};
    candidateNames.forEach(n => (candidateScores[n] = 0));

    for (let i = 3; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) continue;
      const dim = String(row[0] || '').trim();
      if (!dim || dim.includes('综合匹配度') || dim.includes('排名')) continue;

      const weight = parseFloat(String(row[1] || '0')) || 0;
      const scores: Record<string, number> = {};
      candidateNames.forEach((n, idx) => {
        const score = parseFloat(String(row[idx + 2] || '0')) || 0;
        scores[n] = score;
      });
      dimensions.push({ dimension: dim, weight, scores });
    }

    const rankings: Array<{ rank: number; name: string; score: number }> = [];
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      if (!row) continue;
      const first = String(row[0] || '');
      if (first.includes('排名')) {
        const text = String(row[1] || first);
        const matches = text.match(/(\d+)\.\s*([^>]+)/g);
        if (matches) {
          matches.forEach((m, idx) => {
            const parts = m.match(/(\d+)\.\s*([^\d>]+)/);
            if (parts) {
              const n = parts[2].trim();
              rankings.push({ rank: idx + 1, name: n, score: candidateScores[n] || 0 });
            }
          });
        }
        break;
      }
    }

    const existing = await prisma.candidateComparison.findFirst({ where: { sheetId: name } });
    const data = {
      title,
      sheetId: name,
      targetJd,
      targetJdId,
      dimensions: JSON.stringify(dimensions),
      candidates: JSON.stringify(candidateNames),
      rankings: JSON.stringify(rankings),
    };

    const comparison = existing
      ? await prisma.candidateComparison.update({ where: { id: existing.id }, data })
      : await prisma.candidateComparison.create({ data });

    return {
      type: 'comparison',
      sheet: name,
      status: 'success',
      id: comparison.id,
      isUpdate: !!existing,
      message: `${existing ? '更新' : '新增'}对比分析：${title}`,
    };
  } catch (err) {
    return { type: 'comparison', sheet: name, status: 'error', message: (err as Error).message };
  }
}
