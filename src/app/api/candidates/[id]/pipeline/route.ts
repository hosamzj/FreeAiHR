import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken, verifyToken, success, error } from '@/lib/auth';

// POST /api/candidates/[id]/pipeline — 推进候选人流程
// Body: { action: 'screen' | 'schedule_interview' | 'complete_interview' | 'generate_offer' | 'accept_offer' | 'reject' | 'start_onboarding', ...params }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken();
  if (!token) return error(401, '未登录或登录已过期');

  const payload = verifyToken(token);
  if (!payload) return error(401, '登录已过期，请重新登录');

  const { id } = await params;
  const body = await req.json();
  const { action, ...actionParams } = body;

  if (!action) {
    return error(422, '缺少 action 参数');
  }

  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) {
    return error(422, '候选人不存在');
  }

  try {
    switch (action) {
      case 'screen': {
        // new → screening: HR 通过初筛
        if (candidate.status !== 'new') {
          return error(422, '只能对"新简历"状态的候选人执行此操作');
        }
        const updated = await prisma.candidate.update({
          where: { id },
          data: { status: 'screening' },
        });
        return success({ candidate: updated, action: 'screened' });
      }

      case 'schedule_interview': {
        // screening → interviewing: 安排面试
        if (candidate.status !== 'screening') {
          return error(422, '只能对"筛选中"状态的候选人执行此操作');
        }
        const { interviewerId, positionId, type, scheduledAt, duration, location, notes } = actionParams;
        if (!interviewerId || !scheduledAt) {
          return error(422, '缺少面试官或面试时间');
        }

        const interview = await prisma.interview.create({
          data: {
            candidateId: id,
            positionId: positionId || null,
            interviewerId,
            type: type || 'first',
            status: 'scheduled',
            scheduledAt: new Date(scheduledAt),
            duration: duration || 60,
            location: location || '',
            notes: notes || '',
          },
        });

        const updated = await prisma.candidate.update({
          where: { id },
          data: { status: 'interviewing' },
        });

        return success({ candidate: updated, interview, action: 'interview_scheduled' });
      }

      case 'complete_interview': {
        // interviewing → offered: 面试完成，进入Offer阶段
        if (candidate.status !== 'interviewing') {
          return error(422, '只能对"面试中"状态的候选人执行此操作');
        }
        const { interviewId, evaluation } = actionParams;

        // Update interview status
        if (interviewId) {
          await prisma.interview.update({
            where: { id: interviewId },
            data: { status: 'completed' },
          });

          // Create evaluation if provided
          if (evaluation) {
            await prisma.interviewEvaluation.create({
              data: {
                interviewId,
                evaluatorId: payload.userId,
                technicalScore: evaluation.technicalScore,
                communicationScore: evaluation.communicationScore,
                cultureScore: evaluation.cultureScore,
                overallScore: evaluation.overallScore,
                strengths: evaluation.strengths,
                weaknesses: evaluation.weaknesses,
                recommendation: evaluation.recommendation || 'maybe',
                comments: evaluation.comments,
              },
            });
          }
        }

        const updated = await prisma.candidate.update({
          where: { id },
          data: { status: 'offered' },
        });

        return success({ candidate: updated, action: 'interview_completed' });
      }

      case 'generate_offer': {
        // offered: 生成Offer
        if (candidate.status !== 'offered') {
          return error(422, '只能对"待Offer"状态的候选人执行此操作');
        }
        const { positionId, salaryBase, salaryBonus, salaryStock, startDate, benefits } = actionParams;

        const offer = await prisma.offer.create({
          data: {
            candidateId: id,
            positionId: positionId || null,
            creatorId: payload.userId,
            status: 'draft',
            salaryBase: salaryBase || null,
            salaryBonus: salaryBonus || null,
            salaryStock: salaryStock || null,
            startDate: startDate ? new Date(startDate) : null,
            benefits: benefits ? JSON.stringify(benefits) : null,
          },
        });

        return success({ candidate, offer, action: 'offer_generated' });
      }

      case 'accept_offer': {
        // offered → hired: 候选人接受Offer
        if (candidate.status !== 'offered') {
          return error(422, '只能对"待Offer"状态的候选人执行此操作');
        }
        const { offerId } = actionParams;

        // Update offer status
        if (offerId) {
          await prisma.offer.update({
            where: { id: offerId },
            data: { status: 'accepted', approvedAt: new Date() },
          });
        }

        const updated = await prisma.candidate.update({
          where: { id },
          data: { status: 'hired' },
        });

        return success({ candidate: updated, action: 'offer_accepted' });
      }

      case 'start_onboarding': {
        // hired: 发起入职流程
        if (candidate.status !== 'hired') {
          return error(422, '只能对"已入职"状态的候选人执行此操作');
        }
        const { position, department, startDate, managerId, mentorId } = actionParams;

        // Create onboarding record
        const onboarding = await prisma.onboarding.create({
          data: {
            candidateId: id,
            employeeName: candidate.name,
            position: position || candidate.currentPosition || '',
            department: department || candidate.department || '',
            managerId: managerId || null,
            mentorId: mentorId || null,
            startDate: startDate ? new Date(startDate) : new Date(),
            status: 'pending',
          },
        });

        // Create contract record
        const contractNo = `HT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        const contract = await prisma.contract.create({
          data: {
            contractNo,
            employeeId: payload.userId,
            employeeName: candidate.name,
            department: department || candidate.department || '',
            position: position || candidate.currentPosition || '',
            contractType: 'regular',
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)),
            status: 'pending_sign',
            candidateId: id,
            source: 'recruitment',
            onboardingId: onboarding.id,
          },
        });

        // Update onboarding with contractId
        await prisma.onboarding.update({
          where: { id: onboarding.id },
          data: { contractId: contract.id },
        });

        return success({
          candidate,
          onboarding,
          contract,
          action: 'onboarding_started',
        });
      }

      case 'reject': {
        // 淘汰候选人
        const { reason } = actionParams;
        const updated = await prisma.candidate.update({
          where: { id },
          data: { status: 'rejected' },
        });
        return success({ candidate: updated, reason, action: 'rejected' });
      }

      default:
        return error(422, `未知操作: ${action}`);
    }
  } catch (err) {
    console.error('Pipeline error:', err);
    return error(500, '流程操作失败');
  }
}
