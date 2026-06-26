import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, success, unauthorized, error } from '@/lib/auth';

// GET /api/positions
export async function GET() {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const positions = await prisma.jobPosition.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { candidates: true },
      },
    },
  });

  return success(positions);
}

// POST /api/positions
export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { title, department, location, type, description, requirements, salaryMin, salaryMax, headcount } = body;

    if (!title || !department) {
      return error(422, '岗位名称和所属部门为必填项');
    }

    const position = await prisma.jobPosition.create({
      data: {
        title,
        department,
        location: location || null,
        type: type || 'full_time',
        description: description || null,
        requirements: requirements || null,
        salaryMin: salaryMin || null,
        salaryMax: salaryMax || null,
        headcount: headcount || 1,
      },
    });

    return success(position);
  } catch (e: any) {
    console.error('Create position error:', e);
    return error(500, '创建职位失败');
  }
}

// PUT /api/positions
export async function PUT(request: Request) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return error(422, '缺少职位ID');
    }

    const position = await prisma.jobPosition.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.requirements !== undefined && { requirements: data.requirements }),
        ...(data.salaryMin !== undefined && { salaryMin: data.salaryMin }),
        ...(data.salaryMax !== undefined && { salaryMax: data.salaryMax }),
        ...(data.headcount !== undefined && { headcount: data.headcount }),
      },
    });

    return success(position);
  } catch (e: any) {
    console.error('Update position error:', e);
    return error(500, '更新职位失败');
  }
}

// DELETE /api/positions?id=xxx
export async function DELETE(request: Request) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return error(422, '缺少职位ID');
    }

    await prisma.jobPosition.delete({ where: { id } });

    return success(null, '删除成功');
  } catch (e: any) {
    console.error('Delete position error:', e);
    return error(500, '删除职位失败');
  }
}
