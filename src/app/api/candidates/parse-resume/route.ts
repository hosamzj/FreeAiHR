import { NextRequest } from 'next/server';
import { success, error } from '@/lib/auth';
import { parseResume } from '@/lib/ai';

// POST /api/candidates/parse-resume - AI 简历解析
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText, fileName } = body;

    if (!resumeText) return error(422, '简历内容不能为空');

    // 使用 AI 解析简历
    const aiParsed = await parseResume(resumeText);

    return success({
      ...aiParsed,
      fileName,
      source: 'ai',
    });
  } catch (e) {
    console.error('Parse resume error:', e);
    return error(500, '简历解析失败');
  }
}
