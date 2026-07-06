import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// GET /api/onboarding/eligible-employees
// 获取已签合同但还没有入职记录的人员列表
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    // 查找所有已完成的合同
    const completedContracts = await prisma.contract.findMany({
      where: {
        status: 'completed',
      },
      select: {
        id: true,
        employeeName: true,
        employeeId: true,
        department: true,
        position: true,
        startDate: true,
        endDate: true,
        candidateId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 查找已经有入职记录的合同ID
    const existingOnboardings = await prisma.onboarding.findMany({
      where: {
        contractId: {
          in: completedContracts.map(c => c.id),
        },
      },
      select: {
        contractId: true,
      },
    });

    const existingContractIds = new Set(existingOnboardings.map(o => o.contractId));

    // 过滤出还没有入职记录的合同
    const eligibleEmployees = completedContracts
      .filter(c => !existingContractIds.has(c.id))
      .map(c => ({
        id: c.id,
        contractId: c.id,
        name: c.employeeName,
        employeeId: c.employeeId,
        department: c.department,
        position: c.position,
        startDate: c.startDate,
        endDate: c.endDate,
        candidateId: c.candidateId,
        completedAt: c.createdAt,
      }));

    return success({
      employees: eligibleEmployees,
      total: eligibleEmployees.length,
    });

  } catch (err) {
    console.error('Get eligible employees error:', err);
    return error(500, '获取可选员工列表失败');
  }
}
