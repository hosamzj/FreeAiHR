import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, success, error } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// POST /api/candidates/[id]/resume - Upload resume file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return error(401, '未登录或登录已过期');
    }
    const { id } = await params;

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      return error(404, '候选人不存在');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return error(400, '未选择文件');
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 
                          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return error(400, '不支持的文件格式，仅支持 PDF、Word、图片');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return error(400, '文件大小不能超过 10MB');
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'pdf';
    const filename = `${id}_${Date.now()}.${ext}`;
    
    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Update candidate with resume URL
    const resumeUrl = `/uploads/resumes/${filename}`;
    await prisma.candidate.update({
      where: { id },
      data: { resumeUrl },
    });

    return success({ 
      resumeUrl,
      filename: file.name,
      size: file.size,
      type: file.type 
    }, '简历上传成功');
  } catch (e) {
    console.error('Upload resume error:', e);
    if (e instanceof Error && e.message === 'Unauthorized') {
      return error(401, '未登录或登录已过期');
    }
    return error(500, '上传简历失败');
  }
}

// GET /api/candidates/[id]/resume - Get resume info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return error(401, '未登录或登录已过期');
    }
    const { id } = await params;

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: { 
        id: true, 
        name: true, 
        appliedPosition: true,
        resumeUrl: true 
      },
    });

    if (!candidate) {
      return error(404, '候选人不存在');
    }

    return success({
      id: candidate.id,
      name: candidate.name,
      appliedPosition: candidate.appliedPosition,
      resumeUrl: candidate.resumeUrl,
      hasResume: !!candidate.resumeUrl,
    });
  } catch (e) {
    console.error('Get resume error:', e);
    if (e instanceof Error && e.message === 'Unauthorized') {
      return error(401, '未登录或登录已过期');
    }
    return error(500, '获取简历信息失败');
  }
}
