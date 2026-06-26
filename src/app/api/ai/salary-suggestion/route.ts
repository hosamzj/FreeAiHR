import { NextRequest } from 'next/server';
import { success, error, requireAuth } from '@/lib/auth';
import { suggestSalary } from '@/lib/ai';

// POST /api/ai/salary-suggestion - AI 薪资建议
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) return error(401, '请先登录');

    const body = await request.json();
    const { candidateResume, positionTitle, positionLevel, city } = body;

    if (!candidateResume || !positionTitle) {
      return error(422, '请提供候选人简历和职位名称');
    }

    const result = await suggestSalary(
      candidateResume,
      positionTitle,
      positionLevel || '中级',
      city || '北京'
    );

    return success(result);
  } catch (e) {
    console.error('Salary suggestion error:', e);
    return error(500, '薪资建议生成失败');
  }
}
