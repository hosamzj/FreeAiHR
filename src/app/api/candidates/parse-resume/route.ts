import { NextRequest } from 'next/server';
import { success, error } from '@/lib/auth';
import { parseResume, parseResumeFromImage } from '@/lib/ai';

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
        // 图片：使用多模态视觉解析
        const base64 = buffer.toString('base64');
        aiParsed = await parseResumeFromImage(base64, mimeType);
      } else if (mimeType === 'application/pdf') {
        // PDF：尝试提取文本，失败则用视觉解析
        const text = buffer.toString('utf-8');
        const hasText = text.replace(/[^a-zA-Z\u4e00-\u9fff]/g, '').length > 100;
        if (hasText) {
          aiParsed = await parseResume(text);
        } else {
          const base64 = buffer.toString('base64');
          aiParsed = await parseResumeFromImage(base64, 'image/png');
        }
      } else {
        // 其他格式：作为文本读取
        const text = buffer.toString('utf-8');
        if (text.replace(/[^a-zA-Z\u4e00-\u9fff]/g, '').length > 20) {
          aiParsed = await parseResume(text);
        } else {
          return error(422, '不支持的文件格式，请上传 PDF、图片或文本文件');
        }
      }

      return success({
        ...aiParsed,
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
      ...aiParsed,
      fileName,
      source: 'ai',
    });
  } catch (e) {
    console.error('Parse resume error:', e);
    return error(500, '简历解析失败');
  }
}
