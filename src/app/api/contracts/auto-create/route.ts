import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// POST /api/contracts/auto-create - 从候选人数据自动创建合同
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    const body = await request.json();
    const { candidateId, contractDuration = 1 } = body;

    if (!candidateId) {
      return error(422, '缺少候选人ID');
    }

    // 获取候选人信息
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return error(404, '候选人不存在');
    }

    // 检查是否已存在合同
    const existingContract = await prisma.contract.findFirst({
      where: { candidateId },
    });

    if (existingContract) {
      return error(400, '该候选人已存在合同记录');
    }

    // 生成工号
    const employeeId = `EMP${Date.now().toString().slice(-6)}`;

    // 生成合同编号：HT-YYYYMMDD-XXXX
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');
    
    // 查询今天已有的合同数量，用于生成序号
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const todayContracts = await prisma.contract.count({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });
    
    const contractNo = `HT-${dateStr}-${(todayContracts + 1).toString().padStart(4, '0')}`;

    // 计算合同日期
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + contractDuration);

    // 创建合同记录
    const contract = await prisma.contract.create({
      data: {
        contractNo,
        employeeId,
        employeeName: candidate.name,
        department: candidate.department || '',
        position: candidate.appliedPosition || '',
        contractType: 'regular',
        startDate,
        endDate,
        status: 'pending_sign',
        candidateId,
        source: 'recruitment',
      },
    });

    // 更新候选人状态为已入职
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: 'hired' },
    });

    return success({
      contract,
      message: '合同创建成功',
    });
  } catch (err) {
    console.error('Auto create contract error:', err);
    return error(500, '创建合同失败');
  }
}
