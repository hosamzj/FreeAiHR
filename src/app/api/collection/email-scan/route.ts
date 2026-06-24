import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// POST - 扫描邮箱获取简历
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { configId, keywords = ['简历', '应聘', '求职'] } = body;

    if (!configId) {
      return error(422, '请提供邮箱配置ID');
    }

    // 获取邮箱配置
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'email_config' },
    });

    if (!config) {
      return error(404, '未找到邮箱配置');
    }

    let configs: Array<{ id: string; email: string }> = [];
    try {
      configs = JSON.parse(config.value);
    } catch {
      return error(500, '邮箱配置格式错误');
    }

    const emailConfig = configs.find((c) => c.id === configId);
    if (!emailConfig) {
      return error(404, '未找到指定的邮箱配置');
    }

    // 模拟扫描结果（实际实现需要连接IMAP服务器）
    const mockResumes = [
      {
        id: `resume_${Date.now()}_1`,
        subject: '应聘前端工程师-张三-5年经验',
        from: 'zhangsan@example.com',
        date: new Date().toISOString(),
        attachmentName: '张三_简历.pdf',
        attachmentType: 'application/pdf',
      },
      {
        id: `resume_${Date.now()}_2`,
        subject: '求职产品经理-李四简历',
        from: 'lisi@example.com',
        date: new Date(Date.now() - 86400000).toISOString(),
        attachmentName: '李四_产品经理_简历.docx',
        attachmentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      {
        id: `resume_${Date.now()}_3`,
        subject: '应聘Java开发-王五-3年经验',
        from: 'wangwu@example.com',
        date: new Date(Date.now() - 172800000).toISOString(),
        attachmentName: '王五_Java开发_简历.pdf',
        attachmentType: 'application/pdf',
      },
    ];

    // 创建任务记录
    const taskId = `task_${Date.now()}`;
    const taskData = {
      id: taskId,
      type: 'email_scan',
      source: emailConfig.email,
      status: 'completed',
      total: mockResumes.length,
      imported: mockResumes.length,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    // 保存任务记录
    const tasksConfig = await prisma.systemConfig.findUnique({
      where: { key: 'collection_tasks' },
    });

    let tasks: Array<Record<string, unknown>> = [];
    if (tasksConfig) {
      try {
        tasks = JSON.parse(tasksConfig.value);
      } catch {
        tasks = [];
      }
    }
    tasks.unshift(taskData);

    await prisma.systemConfig.upsert({
      where: { key: 'collection_tasks' },
      update: { value: JSON.stringify(tasks) },
      create: { key: 'collection_tasks', value: JSON.stringify(tasks) },
    });

    return success({
      taskId,
      email: emailConfig.email,
      keywords,
      scanned: mockResumes.length,
      resumes: mockResumes,
      message: `扫描完成，发现 ${mockResumes.length} 份简历`,
    });
  } catch (err) {
    console.error('Email scan error:', err);
    return error(500, '邮箱扫描失败', 500);
  }
}
