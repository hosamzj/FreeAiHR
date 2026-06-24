import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// GET /api/contracts/:id/candidate-info - 获取合同关联的候选人信息
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

    // 获取合同信息
    const contract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      return error(404, '合同不存在');
    }

    if (!contract.candidateId) {
      return error(404, '该合同未关联候选人');
    }

    // 获取候选人信息
    const candidate = await prisma.candidate.findUnique({
      where: { id: contract.candidateId },
    });

    if (!candidate) {
      return error(404, '候选人不存在');
    }

    return success({
      contract: {
        id: contract.id,
        employeeName: contract.employeeName,
        status: contract.status,
        source: contract.source,
      },
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        appliedPosition: candidate.appliedPosition,
        department: candidate.department,
        status: candidate.status,
        education: candidate.education,
        experience: candidate.experience,
        skills: candidate.skills,
        resumeUrl: candidate.resumeUrl,
        createdAt: candidate.createdAt,
      },
    });
  } catch (err) {
    console.error('Get candidate info error:', err);
    return error(500, '获取候选人信息失败');
  }
}
