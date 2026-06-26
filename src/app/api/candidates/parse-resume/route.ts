import { NextRequest } from 'next/server';
import { success, error } from '@/lib/auth';
import { parseResumeWithLLM, ParsedResume } from '@/lib/ai';
import mammoth from 'mammoth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// pdf-parse v2 uses PDFParse class
async function parsePDF(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const pdf = new PDFParse({ data: buffer });
  const result = await pdf.getText();
  return result.text || '';
}

// 保存上传文件到 public/uploads/resumes/
async function saveUploadedFile(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
  await mkdir(uploadDir, { recursive: true });
  const ext = path.extname(file.name) || '.bin';
  const uniqueName = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(uploadDir, uniqueName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);
  return `/uploads/resumes/${uniqueName}`;
}

// POST /api/candidates/parse-resume - 简历文件上传并 AI 解析
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // 处理 multipart 文件上传
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const resumeText = formData.get('resumeText') as string | null;

      // 如果有文本内容，直接解析
      if (resumeText) {
        const parsed = await parseResumeWithLLM(resumeText);
        return success({ ...parsed, fileName: 'text-input', confidence: 0.95, fileUrl: '' });
      }

      if (!file) {
        return error(422, '请上传简历文件');
      }

      // 保存原始文件作为附件
      let fileUrl = '';
      try {
        fileUrl = await saveUploadedFile(file);
      } catch (saveErr) {
        console.error('Save file error:', saveErr);
        // 保存失败不阻塞解析流程
      }

      const fileName = file.name.toLowerCase();
      const buffer = Buffer.from(await file.arrayBuffer());

      // 根据文件类型提取文本
      let extractedText = '';

      if (fileName.endsWith('.pdf')) {
        // PDF 提取
        try {
          extractedText = await parsePDF(buffer);
        } catch (pdfErr) {
          console.error('PDF parse error:', pdfErr);
          return error(422, 'PDF 文件解析失败，请确认文件未加密或损坏');
        }
      } else if (fileName.endsWith('.docx')) {
        // Word 提取
        try {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value || '';
        } catch (docxErr) {
          console.error('DOCX parse error:', docxErr);
          return error(422, 'Word 文件解析失败');
        }
      } else if (fileName.endsWith('.doc')) {
        return error(422, '暂不支持 .doc 格式，请转换为 .docx 后上传');
      } else if (fileName.endsWith('.txt')) {
        extractedText = buffer.toString('utf-8');
      } else if (['.png', '.jpg', '.jpeg', '.webp', '.bmp'].some(ext => fileName.endsWith(ext))) {
        // 图片文件：使用多模态 LLM 直接解析
        const mimeType = fileName.endsWith('.png') ? 'image/png'
          : fileName.endsWith('.webp') ? 'image/webp'
          : fileName.endsWith('.bmp') ? 'image/bmp'
          : 'image/jpeg';
        const base64 = buffer.toString('base64');

        const parsed = await parseResumeWithLLM({
          type: 'image',
          base64,
          mimeType,
        });

        return success({
          ...parsed,
          fileName: file.name,
          confidence: 0.92,
          parseMethod: 'multimodal-llm',
          fileUrl,
        });
      } else {
        return error(422, '不支持的文件格式，请上传 PDF、Word、图片或 TXT 文件');
      }

      // 检查提取的文本是否有效
      if (!extractedText || extractedText.trim().length < 10) {
        return error(422, '未能从文件中提取到有效文本内容，请确认文件内容完整');
      }

      // 使用 LLM 解析提取的文本
      const parsed = await parseResumeWithLLM(extractedText);

      return success({
        ...parsed,
        fileName: file.name,
        confidence: 0.93,
        parseMethod: 'text-llm',
        rawTextLength: extractedText.length,
        fileUrl,
      });
    }

    // 兼容旧的 JSON body 方式
    const body = await request.json();
    const { resumeText, fileName } = body;

    if (!resumeText) return error(422, '简历内容不能为空');

    const parsed = await parseResumeWithLLM(resumeText);
    return success({ ...parsed, fileName: fileName || 'text', confidence: 0.93 });
  } catch (e) {
    console.error('Parse resume error:', e);
    return error(500, '简历解析失败，请稍后重试');
  }
}
