import { prisma } from '@/lib/prisma';
import type { SyncResult } from './types';

export async function processJdSheet(name: string, rows: unknown[][]): Promise<SyncResult> {
  try {
    const kv: Record<string, string> = {};
    const structured: Array<{ dimension: string; requirement: string; weight: number; ko: boolean }> = [];
    const jdTextLines: string[] = [];

    let mode: 'meta' | 'structured' | 'fulltext' = 'meta';
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const first = String(row[0] || '').trim();
      if (!first) continue;

      if (first.includes('结构化要求')) {
        mode = 'structured';
        continue;
      }
      if (first.includes('原文摘要')) {
        mode = 'fulltext';
        continue;
      }
      if (first === '维度 Dimension' || first === '权重合计 Total Weight') continue;

      if (mode === 'meta') {
        kv[first] = String(row[1] || '');
      } else if (mode === 'structured') {
        structured.push({
          dimension: first,
          requirement: String(row[1] || ''),
          weight: parseFloat(String(row[2] || '0')) || 0,
          ko: /yes|是/i.test(String(row[3] || '')),
        });
      } else if (mode === 'fulltext') {
        jdTextLines.push(first);
      }
    }

    const title = kv['职位名称 Position'] || name;
    const sourceFile = kv['来源文件 Source'];
    const sheetId = kv['JD Sheet ID'] || name;
    const rawJd = jdTextLines.join('\n');

    const existing = await prisma.jobPosition.findFirst({ where: { sheetId } });
    const position = existing
      ? await prisma.jobPosition.update({
          where: { id: existing.id },
          data: {
            title,
            sourceFile,
            rawJd,
            structuredRequirements: JSON.stringify(structured),
            requirements: JSON.stringify(structured),
            description: rawJd.slice(0, 1000),
          },
        })
      : await prisma.jobPosition.create({
          data: {
            title,
            department: '未分配',
            sourceFile,
            sheetId,
            rawJd,
            structuredRequirements: JSON.stringify(structured),
            requirements: JSON.stringify(structured),
            description: rawJd.slice(0, 1000),
          },
        });

    return {
      type: 'jd',
      sheet: name,
      status: 'success',
      id: position.id,
      isUpdate: !!existing,
      message: `${existing ? '更新' : '新增'}岗位：${title}`,
    };
  } catch (err) {
    return { type: 'jd', sheet: name, status: 'error', message: (err as Error).message };
  }
}
