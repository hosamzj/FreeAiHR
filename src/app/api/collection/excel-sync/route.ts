import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { requireRole, success, unauthorized, badRequest } from '@/lib/auth';
import { processJdSheet } from '@/lib/excel-sync/jd-sheet';
import { processResumeSheet } from '@/lib/excel-sync/resume-sheet';
import { processInterviewSheet } from '@/lib/excel-sync/interview-sheet';
import { processComparisonSheet } from '@/lib/excel-sync/comparison-sheet';

function detectSheetType(name: string): 'jd' | 'resume' | 'interview' | 'comparison' | 'skill' {
  if (name.startsWith('JD-')) return 'jd';
  if (name.endsWith('-简历分析')) return 'resume';
  if (name.endsWith('-面试分析')) return 'interview';
  if (name.startsWith('候选人对比-')) return 'comparison';
  return 'skill';
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
    const results = [];

    for (const sheetName of workbook.SheetNames) {
      const type = detectSheetType(sheetName);
      if (type === 'skill') continue;

      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

      let result;
      switch (type) {
        case 'jd':
          result = await processJdSheet(sheetName, rows);
          break;
        case 'resume':
          result = await processResumeSheet(sheetName, rows);
          break;
        case 'interview':
          result = await processInterviewSheet(sheetName, rows);
          break;
        case 'comparison':
          result = await processComparisonSheet(sheetName, rows);
          break;
      }
      results.push(result);
    }

    return success({
      total: results.length,
      results,
      summary: {
        jd: results.filter(r => r.type === 'jd' && r.status === 'success').length,
        resume: results.filter(r => r.type === 'resume' && r.status === 'success').length,
        interview: results.filter(r => r.type === 'interview' && r.status === 'success').length,
        comparison: results.filter(r => r.type === 'comparison' && r.status === 'success').length,
        updated: results.filter(r => r.status === 'success' && r.isUpdate).length,
        created: results.filter(r => r.status === 'success' && !r.isUpdate).length,
        errors: results.filter(r => r.status === 'error').length,
      },
    });
  } catch (err) {
    return badRequest(`同步失败: ${(err as Error).message}`);
  }
}
