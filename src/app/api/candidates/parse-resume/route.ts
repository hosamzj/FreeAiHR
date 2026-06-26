import { NextRequest } from 'next/server';
import { success, error } from '@/lib/auth';
import { parseResume, parseResumeFromImage } from '@/lib/ai';

// 将 AI 原始输出规范化为前端期望的格式
function normalizeParsed(raw: Record<string, unknown>): Record<string, unknown> {
  const skills = Array.isArray(raw.skills) ? raw.skills as string[] : [];
  const educationArr = Array.isArray(raw.education) ? raw.education as Array<Record<string, unknown>> : [];
  const experienceArr = Array.isArray(raw.experience) ? raw.experience as Array<Record<string, unknown>> : [];

  // 学历：取最高学历
  const topEdu = educationArr[0];
  const educationStr = topEdu
    ? `${topEdu.degree || ''}·${topEdu.school || ''}`.replace(/^·|·$/g, '')
    : (typeof raw.education === 'string' ? raw.education : '');

  // 学校
  const school = topEdu?.school as string || (typeof raw.school === 'string' ? raw.school : '');

  // 工作年限：从 experience 数组推算
  const yearsExp = experienceArr.length > 0
    ? `${experienceArr.length}年以上工作经验`
    : (typeof raw.experience === 'string' ? raw.experience : '');

  // 当前/最近公司
  const latestExp = experienceArr[0];
  const company = latestExp?.company as string || '';

  // 当前/最近职位
  const position = latestExp?.position as string || '';

  // 匹配分数：用 confidence 映射
  const confidence = typeof raw.confidence === 'number' ? raw.confidence : 0.85;
  const matchScore = Math.round(confidence * 100);

  return {
    name: raw.name || '',
    phone: raw.phone || '',
    email: raw.email || '',
    avatar: '',
    position,
    education: educationStr,
    school,
    experience: yearsExp,
    company,
    matchScore,
    summary: raw.summary || '',
    matchedSkills: skills,
    uncertainSkills: [] as string[],
  };
}

// POST /api/candidates/parse-resume - AI 简历解析
// 支持两种模式：
// 1. JSON: { resumeText, fileName } - 文本简历
// 2. FormData: file 字段 - PDF/图片文件上传
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // 模式1：文件上传（PDF/图片）
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) return error(422, '请上传简历文件');

      const fileName = file.name;
      const mimeType = file.type;
      const buffer = Buffer.from(await file.arrayBuffer());

      let aiParsed: Record<string, unknown>;

      if (mimeType.startsWith('image/')) {
        const base64 = buffer.toString('base64');
        aiParsed = await parseResumeFromImage(base64, mimeType);
      } else if (mimeType === 'application/pdf') {
        const text = buffer.toString('utf-8');
        const hasText = text.replace(/[^a-zA-Z\u4e00-\u9fff]/g, '').length > 100;
        if (hasText) {
          aiParsed = await parseResume(text);
        } else {
          const base64 = buffer.toString('base64');
          aiParsed = await parseResumeFromImage(base64, 'image/png');
        }
      } else {
        const text = buffer.toString('utf-8');
        if (text.replace(/[^a-zA-Z\u4e00-\u9fff]/g, '').length > 20) {
          aiParsed = await parseResume(text);
        } else {
          return error(422, '不支持的文件格式，请上传 PDF、图片或文本文件');
        }
      }

      return success({
        ...normalizeParsed(aiParsed),
        fileName,
        source: 'ai',
      });
    }

    // 模式2：JSON 文本简历
    const body = await request.json();
    const { resumeText, fileName } = body;

    if (!resumeText) return error(422, '简历内容不能为空');

    const aiParsed = await parseResume(resumeText);

    return success({
      ...normalizeParsed(aiParsed),
      fileName,
      source: 'ai',
    });
  } catch (e) {
    console.error('Parse resume error:', e);
    return error(500, '简历解析失败');
  }
}
