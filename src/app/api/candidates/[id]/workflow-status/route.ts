import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// GET /api/candidates/:id/workflow-status - 获取候选人全链路状态
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

    // 获取候选人信息
    const candidate = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      return error(404, '候选人不存在');
    }

    // 获取关联的合同
    const contract = await prisma.contract.findFirst({
      where: { candidateId: id },
      orderBy: { createdAt: 'desc' },
    });

    // 获取关联的入职记录
    const onboarding = await prisma.onboarding.findFirst({
      where: {
        OR: [
          { candidateId: id },
          ...(contract ? [{ contractId: contract.id }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // 获取入职任务进度
    let taskProgress = null;
    if (onboarding) {
      const tasks = await prisma.onboardingTask.findMany({
        where: { onboardingId: onboarding.id },
      });
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      taskProgress = {
        total: tasks.length,
        completed: completedTasks,
        percentage: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
      };
    }

    // 确定当前阶段
    let currentStage = 'recruitment';
    let stageDetails = {
      recruitment: { status: candidate.status, progress: null },
      contract: null as { contractNo: string; status: string; signProgress: number } | null,
      onboarding: null as { status: string; taskProgress: typeof taskProgress } | null,
      completed: null as { completedAt: Date } | null,
    };

    if (candidate.status === 'hired' && !contract) {
      currentStage = 'pending_contract';
    } else if (contract) {
      if (contract.status === 'completed') {
        if (onboarding) {
          if (onboarding.status === 'completed') {
            currentStage = 'completed';
            stageDetails.completed = { completedAt: onboarding.updatedAt };
          } else {
            currentStage = 'onboarding';
            stageDetails.onboarding = {
              status: onboarding.status,
              taskProgress,
            };
          }
        } else {
          currentStage = 'pending_onboarding';
        }
      } else {
        currentStage = 'contract';
        stageDetails.contract = {
          contractNo: contract.id.slice(-8).toUpperCase(),
          status: contract.status,
          signProgress: contract.status === 'pending_sign' ? 0 : contract.status === 'signing' ? 50 : 100,
        };
      }
    }

    return success({
      candidateId: id,
      candidateName: candidate.name,
      currentStage,
      stageDetails,
      contract: contract ? {
        id: contract.id,
        contractNo: contract.id.slice(-8).toUpperCase(),
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
      } : null,
      onboarding: onboarding ? {
        id: onboarding.id,
        status: onboarding.status,
        taskProgress,
      } : null,
    });
  } catch (err) {
    console.error('Get workflow status error:', err);
    return error(500, '获取流程状态失败');
  }
}
