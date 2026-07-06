import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// GET /api/position-templates - 获取岗位模板列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const industry = searchParams.get('industry');
    const status = searchParams.get('status') || 'active';

    const where: Record<string, unknown> = { status };
    if (category) where.category = category;
    if (industry) where.industry = industry;

    const templates = await prisma.positionTemplate.findMany({
      where,
      orderBy: { usageCount: 'desc' },
    });

    return success(templates);
  } catch (e) {
    console.error('Get position templates error:', e);
    return error(500, '获取岗位模板失败');
  }
}

// POST /api/position-templates - 创建岗位模板
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { category, title, description, requirements, skillsWeight, experienceWeight, cultureWeight, industry} = body;

    if (!category || !title) {
      return error(422, '岗位类别和名称不能为空');
    }

    const template = await prisma.positionTemplate.create({
      data: {
        category,
        title,
        description,
        requirements: requirements ? JSON.stringify(requirements) : null,
        skillsWeight: skillsWeight ? JSON.stringify(skillsWeight) : '{}',
        experienceWeight: experienceWeight ? JSON.stringify(experienceWeight) : '{}',
        cultureWeight: cultureWeight ? JSON.stringify(cultureWeight) : '{}',
        industry,
      },
    });

    return success(template);
  } catch (e) {
    console.error('Create position template error:', e);
    return error(500, '创建岗位模板失败');
  }
}

// PUT /api/position-templates - 更新岗位模板
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return error(422, '模板ID不能为空');

    const updateData: Record<string, unknown> = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.requirements) updateData.requirements = JSON.stringify(data.requirements);
    if (data.skillsWeight) updateData.skillsWeight = JSON.stringify(data.skillsWeight);
    if (data.experienceWeight) updateData.experienceWeight = JSON.stringify(data.experienceWeight);
    if (data.cultureWeight) updateData.cultureWeight = JSON.stringify(data.cultureWeight);
    if (data.category) updateData.category = data.category;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.status) updateData.status = data.status;

    const template = await prisma.positionTemplate.update({
      where: { id },
      data: updateData,
    });

    return success(template);
  } catch (e) {
    console.error('Update position template error:', e);
    return error(500, '更新岗位模板失败');
  }
}

// DELETE /api/position-templates - 删除岗位模板
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return error(422, '模板ID不能为空');

    await prisma.positionTemplate.delete({ where: { id } });
    return success({ id });
  } catch (e) {
    console.error('Delete position template error:', e);
    return error(500, '删除岗位模板失败');
  }
}
