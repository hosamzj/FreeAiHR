import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/auth';
import { callLLM } from '@/lib/ai';

// POST /api/ai/screening-questions - AI生成初筛问题
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, positionId, count = 6 } = body;

    if (!candidateId) return error(422, '候选人ID不能为空');

    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) return error(404, '候选人不存在');

    // Mock questions
    const mockQuestions = [
      { questionType: 'experience_verify', question: '请详细描述您在上一家公司负责的核心项目，以及您在其中的具体贡献？', order: 1 },
      { questionType: 'skill_depth', question: '针对您简历中提到的技术栈，请举例说明您是如何解决一个复杂技术难题的？', order: 2 },
      { questionType: 'skill_depth', question: '您如何看待当前行业的发展趋势？您认为自己在这个领域有哪些独特的优势？', order: 3 },
      { questionType: 'motivation', question: '您为什么对我们公司和这个岗位感兴趣？您期望在这份工作中获得什么？', order: 4 },
      { questionType: 'salary_expect', question: '您的期望薪资是多少？您对薪酬结构有什么具体要求？', order: 5 },
      { questionType: 'start_date', question: '如果通过面试，您最快什么时候可以到岗？', order: 6 },
    ];

    // Try AI generation
    try {
      const aiResult = await callLLM(
        `根据以下候选人信息生成${count}个初筛问题：
        姓名: ${candidate.name}
        应聘岗位: ${candidate.appliedPosition || '未指定'}
        工作经验: ${candidate.experience || 0}年
        技能: ${candidate.skills}
        
        问题类型包括：experience_verify(经历验证)、skill_depth(技能深度)、motivation(求职动机)、salary_expect(薪资期望)、start_date(到岗时间)
        
        输出JSON数组格式：[{"questionType": "类型", "question": "问题内容", "order": 序号}]`,
        { systemPrompt: 'You are an expert HR assistant that creates screening questions.' }
      );
      
      if (Array.isArray(aiResult) && aiResult.length > 0) {
        // Save questions to database
        const savedQuestions = await Promise.all(
          aiResult.map((q: { questionType: string; question: string; order: number }, i: number) =>
            prisma.screeningQuestion.create({
              data: {
                candidateId,
                positionId,
                questionType: q.questionType,
                question: q.question,
                order: q.order || i + 1,
              },
            })
          )
        );
        return success(savedQuestions);
      }
    } catch {
      // Fall back to mock
    }

    // Save mock questions
    const savedQuestions = await Promise.all(
      mockQuestions.slice(0, count).map(q =>
        prisma.screeningQuestion.create({
          data: { candidateId, positionId, ...q },
        })
      )
    );

    return success(savedQuestions);
  } catch (e) {
    console.error('Screening questions error:', e);
    return error(500, '生成初筛问题失败');
  }
}
