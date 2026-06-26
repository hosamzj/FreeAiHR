import { NextRequest } from 'next/server';
import { success, error } from '@/lib/auth';
import { parseResume, parseResumeFromImage } from '@/lib/ai';
import { S3Storage } from 'coze-coding-dev-sdk';
import mammoth from 'mammoth';

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 将 AI 原始输出规范化为前端期望的格式
function normalizeParsed(raw: Record<string, unknown>): Record<string, unknown> {
  const skills = Array.isArray(raw.skills) ? raw.skills as string[] : [];
  const educationArr = Array.isArray(raw.education) ? raw.education as Array<Record<string, unknown>> : [];
  const experienceArr = Array.isArray(raw.experience) ? raw.experience as Array<Record<string, unknown>> : [];
  const certificates = Array.isArray(raw.certificates) ? raw.certificates as string[] : [];
  const honors = Array.isArray(raw.honors) ? raw.honors as string[] : [];
  const languages = Array.isArray(raw.languages) ? raw.languages as string[] : [];

  // 学历：取最高学历
  const topEdu = educationArr[0];
  const educationStr = topEdu
    ? `${topEdu.degree || ''}·${topEdu.school || ''}`.replace(/^·|·$/g, '')
    : (typeof raw.education === 'string' ? raw.education : '');

  // 学校
  const school = topEdu?.school as string || (typeof raw.school === 'string' ? raw.school : '');

  // 专业
  const major = topEdu?.major as string || (typeof raw.major === 'string' ? raw.major : '');

  // 主修课程
  const courses = Array.isArray(topEdu?.courses) ? topEdu.courses as string[] : [];

  // 工作年限：从 experience 数组推算
  const yearsExp = experienceArr.length > 0
    ? experienceArr.length
    : (typeof raw.experience === 'number' ? raw.experience : 0);

  // 当前/最近公司
  const latestExp = experienceArr[0];
  const company = latestExp?.company as string || '';
  const currentPosition = latestExp?.position as string || '';

  // 应聘岗位
  const appliedPosition = (raw.appliedPosition as string) || currentPosition || '';

  // 匹配分数：用 confidence 映射
  const confidence = typeof raw.confidence === 'number' ? raw.confidence : 0.85;
  const matchScore = Math.round(confidence * 100);

  // 自我评价
  const selfEvaluation = (raw.selfEvaluation as string) || '';

  // 籍贯/现居地
  const birthplace = (raw.birthplace as string) || '';
  const currentLocation = (raw.currentLocation as string) || '';

  return {
    name: raw.name || '',
    phone: raw.phone || '',
    email: raw.email || '',
    avatar: '',
    position: appliedPosition,
    education: educationStr,
    school,
    major,
    courses,
    experience: yearsExp,
    company,
    currentPosition,
    matchScore,
    summary: raw.summary || '',
    selfEvaluation,
    matchedSkills: skills,
    uncertainSkills: [] as string[],
    certificates,
    honors,
    languages,
    birthplace,
    currentLocation,
    // 原始数据透传，供详情弹窗使用
    rawEducation: educationArr,
    rawExperience: experienceArr,
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
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword' ||
        fileName.endsWith('.docx') ||
        fileName.endsWith('.doc')
      ) {
        // Word 文档：用 mammoth 提取纯文本
        const extractResult = await mammoth.extractRawText({ buffer });
        const extractedText = extractResult.value || '';
        if (extractedText.replace(/[^a-zA-Z\u4e00-\u9fff]/g, '').length > 20) {
          aiParsed = await parseResume(extractedText);
        } else {
          return error(422, '无法从Word文档中提取文字内容，请确保文档包含文本而非图片');
        }
        // 记录 mammoth 警告
        if (extractResult.messages.length > 0) {
          console.warn('[Resume] Mammoth warnings:', extractResult.messages);
        }
      } else {
        const text = buffer.toString('utf-8');
        if (text.replace(/[^a-zA-Z\u4e00-\u9fff]/g, '').length > 20) {
          aiParsed = await parseResume(text);
        } else {
          return error(422, '不支持的文件格式，请上传 PDF、Word、图片或文本文件');
        }
      }

      // 上传原始简历文件到对象存储
      let resumeFileKey: string | null = null;
      try {
        const ext = fileName.split('.').pop() || 'bin';
        const safeFileName = `resumes/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        resumeFileKey = await storage.uploadFile({
          fileContent: buffer,
          fileName: safeFileName,
          contentType: mimeType,
        });
      } catch (uploadErr) {
        console.error('[Resume] S3 upload failed:', uploadErr);
        // 上传失败不阻断解析流程
      }

      return success({
        ...normalizeParsed(aiParsed),
        fileName,
        resumeFileKey,
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
