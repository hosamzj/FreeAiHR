import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// GET /api/contracts/eligible-employees
// 获取已入职但还没有合同记录的人员列表
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    // 查找所有状态为hired的候选人
    const hiredCandidates = await prisma.candidate.findMany({
      where: {
        status: 'hired',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        appliedPosition: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 查找已经有合同记录的候选人ID
    const existingContracts = await prisma.contract.findMany({
      where: {
        candidateId: {
          in: hiredCandidates.map(c => c.id),
        },
      },
      select: {
        candidateId: true,
      },
    });

    const existingCandidateIds = new Set(existingContracts.map(c => c.candidateId));

    // 过滤出还没有合同的候选人
    const eligibleEmployees = hiredCandidates
      .filter(c => !existingCandidateIds.has(c.id))
      .map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        department: c.department,
        position: c.appliedPosition,
        hiredAt: c.createdAt,
      }));

    return success({
      employees: eligibleEmployees,
      total: eligibleEmployees.length,
    });
  } catch (err) {
    console.error('Failed to fetch eligible employees:', err);
    return error(500, '获取可选员工列表失败');
  }
}
