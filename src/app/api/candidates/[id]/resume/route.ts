import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, success, error } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { S3Storage } from 'coze-coding-dev-sdk';

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// POST /api/candidates/[id]/resume - Upload resume file to S3
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
    const safeName = file.name.replace(/[^\x00-\x7F]/g, '_') || 'resume';
    const fileName = `resumes/${id}/${Date.now()}_${safeName}.${ext}`;

    // Upload to S3 object storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName,
      contentType: file.type,
    });

    // Generate presigned URL for access
    const resumeUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 2592000, // 30 days
    });

    // Update candidate with resume URL and file key
    await prisma.candidate.update({
      where: { id },
      data: {
        resumeUrl,
        resumeFileKey: fileKey,
      },
    });

    return success({
      resumeUrl,
      resumeFileKey: fileKey,
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

// GET /api/candidates/[id]/resume - Get resume info with download URL
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
        resumeUrl: true,
        resumeFileKey: true,
      },
    });

    if (!candidate) {
      return error(404, '候选人不存在');
    }

    // Generate fresh presigned URL if we have a file key
    let downloadUrl = candidate.resumeUrl;
    if (candidate.resumeFileKey) {
      try {
        downloadUrl = await storage.generatePresignedUrl({
          key: candidate.resumeFileKey,
          expireTime: 3600, // 1 hour for download
        });
      } catch {
        // Fall back to stored URL
      }
    }

    return success({
      id: candidate.id,
      name: candidate.name,
      appliedPosition: candidate.appliedPosition,
      resumeUrl: downloadUrl,
      resumeFileKey: candidate.resumeFileKey,
      hasResume: !!candidate.resumeFileKey,
    });
  } catch (e) {
    console.error('Get resume error:', e);
    if (e instanceof Error && e.message === 'Unauthorized') {
      return error(401, '未登录或登录已过期');
    }
    return error(500, '获取简历信息失败');
  }
}
