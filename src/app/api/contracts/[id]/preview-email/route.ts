import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// GET /api/contracts/[id]/preview-email - 预览合同续签提醒邮件
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
    const { searchParams } = new URL(request.url);
    const reminderType = searchParams.get('reminderType') || 'T-45';

    // 获取合同信息
    const contract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      return error(404, '合同不存在');
    }

    // 获取提醒规则
    const rule = await prisma.contractReminderRule.findFirst({
      where: { name: reminderType },
    });

    // 计算剩余天数
    const endDate = new Date(contract.endDate);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后

    // 生成邮件内容
    const subject = (rule?.templateSubject || '【行动 required】员工[EmployeeName]/[EmployeeID]劳动合同续签确认 - 合同到期日：[EndDate]')
      .replace(/\[EmployeeName\]/g, contract.employeeName)
      .replace(/\[EmployeeID\]/g, contract.employeeId.slice(0, 8))
      .replace(/\[EndDate\]/g, endDate.toLocaleDateString('zh-CN'));

    let body = rule?.templateBody || `Hi [ManagerName]，

员工 [EmployeeName]（工号：[EmployeeID]）的劳动合同将于 [EndDate] 到期。为确保合同续签流程按时完成，请您确认以下事项：

1. 是否同意续签：续签 / 不续签 / 需进一步讨论
2. 如续签，请完成《合同续签申请表》中的部门填写及签字
3. 请安排员工完成本人确认及签字
4. 如不续签，请先与 HRBP/RP 沟通确认后再提交申请表

当前状态：
- 申请表：待提交
- 1st Level Mgr：待签署
- 2nd Level Mgr：待签署
- Employee：待签署
- HR：待签署

请于 [DueDate] 前完成并反馈给 HRS/HRBP。

说明：本提醒由 AI 辅助生成，具体续签决定需由业务经理与 HRBP/RP 按公司流程人工确认。`;

    body = body
      .replace(/\[ManagerName\]/g, '经理')
      .replace(/\[EmployeeName\]/g, contract.employeeName)
      .replace(/\[EmployeeID\]/g, contract.employeeId.slice(0, 8))
      .replace(/\[EndDate\]/g, endDate.toLocaleDateString('zh-CN'))
      .replace(/\[DaysLeft\]/g, daysLeft.toString())
      .replace(/\[DueDate\]/g, dueDate.toLocaleDateString('zh-CN'))
      .replace(/\[Status\]/g, contract.status === 'active' ? '待发起' : contract.status)
      .replace(/\[PendingItems\]/g, contract.renewInitiatedAt ? '待HRBP审批' : '待发起续签')
      .replace(/\[ResponsiblePersons\]/g, '经理、HRBP、HRS');

    const emailPreview = {
      to: 'manager@company.com',
      cc: 'hrbp@company.com, hrs@company.com',
      subject,
      body,
      reminderType,
      contractInfo: {
        employeeName: contract.employeeName,
        department: contract.department,
        position: contract.position,
        endDate: contract.endDate,
        daysLeft,
        status: contract.status,
      },
      recipients: rule ? JSON.parse(rule.recipientTypes || '[]') : ['manager', 'hrbp', 'hrs'],
    };

    return success(emailPreview);
  } catch (err) {
    console.error('Failed to preview email:', err);
    return error(500, '预览邮件失败');
  }
}
