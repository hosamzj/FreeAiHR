import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// GET /api/contracts - 获取合同列表
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { endDate: 'asc' },
    });

    return success(contracts);
  } catch (e) {
    console.error('Get contracts error:', e);
    return error(500, '获取合同列表失败');
  }
}

// POST /api/contracts - 创建合同
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { employeeId, employeeName, department, position, contractType, startDate, endDate } = body;

    if (!employeeId || !employeeName || !startDate || !endDate) {
      return error(422, '缺少必要字段');
    }

    const contract = await prisma.contract.create({
      data: {
        employeeId,
        employeeName,
        department,
        position,
        contractType: contractType || 'regular',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    return success(contract);
  } catch (e) {
    console.error('Create contract error:', e);
    return error(500, '创建合同失败');
  }
}

// PUT /api/contracts - 更新合同
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return error(422, '合同ID不能为空');

    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.renewNotes !== undefined) updateData.renewNotes = data.renewNotes;

    const contract = await prisma.contract.update({
      where: { id },
      data: updateData,
    });

    return success(contract);
  } catch (e) {
    console.error('Update contract error:', e);
    return error(500, '更新合同失败');
  }
}
