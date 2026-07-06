import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// POST /api/contracts/[id]/renew - 发起合同续签
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) return error(401, '未登录');
    const { id } = await params;
    const body = await request.json();

    const { newEndDate, renewNotes } = body;

    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) return error(404, '合同不存在');

    // Update contract with renewal info
    const updated = await prisma.contract.update({
      where: { id },
      data: {
        status: 'renewing',
        renewInitiatedBy: auth.userId,
        renewInitiatedAt: new Date(),
        renewNotes: renewNotes || contract.renewNotes,
        endDate: newEndDate ? new Date(newEndDate) : contract.endDate,
      },
    });

    return success(updated);
  } catch (e) {
    console.error('Renew contract error:', e);
    return error(500, '发起续签失败');
  }
}

// PUT /api/contracts/[id]/renew - 审批/执行续签
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) return error(401, '未登录');
    const { id } = await params;
    const body = await request.json();

    const { action, newEndDate } = body; // action: approve, execute, reject

    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) return error(404, '合同不存在');

    const updateData: Record<string, unknown> = {};

    switch (action) {
      case 'approve':
        updateData.renewApprovedBy = auth.userId;
        updateData.renewApprovedAt = new Date();
        updateData.status = 'renewing';
        break;
      case 'execute':
        updateData.renewExecutedBy = auth.userId;
        updateData.renewExecutedAt = new Date();
        updateData.status = 'renewed';
        if (newEndDate) updateData.endDate = new Date(newEndDate);
        break;
      case 'reject':
        updateData.status = 'terminated';
        break;
      default:
        return error(422, '无效的操作');
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: updateData,
    });

    return success(updated);
  } catch (e) {
    console.error('Process renewal error:', e);
    return error(500, '处理续签失败');
  }
}
