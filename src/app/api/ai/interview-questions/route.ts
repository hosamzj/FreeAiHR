import { NextRequest } from 'next/server';
import { success, error, requireAuth } from '@/lib/auth';
import { generateInterviewQuestions } from '@/lib/ai';

// POST /api/ai/interview-questions - AI 生成面试题目
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) return error(401, '请先登录');

    const body = await request.json();
    const { jdTitle, jdDescription, candidateResume } = body;

    if (!jdTitle || !jdDescription) {
      return error(422, '请提供职位名称和职位描述');
    }

    if (!candidateResume) {
      return error(422, '请提供候选人简历');
    }

    const result = await generateInterviewQuestions(jdTitle, jdDescription, candidateResume);

    return success(result);
  } catch (e) {
    console.error('Generate interview questions error:', e);
    return error(500, '面试题目生成失败');
  }
}
