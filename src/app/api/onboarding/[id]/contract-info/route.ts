import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// GET /api/onboarding/:id/contract-info - 获取入职记录关联的合同信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    const { id } = await params;

    // 获取入职记录
    const onboarding = await prisma.onboarding.findUnique({
      where: { id },
    });

    if (!onboarding) {
      return error(404, '入职记录不存在');
    }

    if (!onboarding.contractId) {
      return success({
        onboarding: {
          id: onboarding.id,
          employeeName: onboarding.employeeName,
          status: onboarding.status,
        },
        contract: null,
        message: '该入职记录未关联合同',
      });
    }

    // 获取合同信息
    const contract = await prisma.contract.findUnique({
      where: { id: onboarding.contractId },
    });

    if (!contract) {
      return error(404, '关联的合同不存在');
    }

    return success({
      onboarding: {
        id: onboarding.id,
        employeeName: onboarding.employeeName,
        status: onboarding.status,
      },
      contract: {
        id: contract.id,
        contractNo: contract.id.slice(-8).toUpperCase(),
        employeeName: contract.employeeName,
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
        contractType: contract.contractType,
      },
    });
  } catch (err) {
    console.error('Get contract info error:', err);
    return error(500, '获取合同信息失败');
  }
}
