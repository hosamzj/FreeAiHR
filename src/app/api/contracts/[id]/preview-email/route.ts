import { NextRequest } from 'next/server';
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

    // 获取邮件模板
    const template = await prisma.emailTemplate.findFirst({
      where: { name: 'contract_renew', enabled: true },
    });

    // 计算剩余天数
    const endDate = new Date(contract.endDate);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 生成邮件主题
    const subject = (template?.subject || '【行动 required】员工{{employeeName}}/{{employeeId}}劳动合同续签确认 - 合同到期日：{{contractEndDate}}')
      .replace(/\{\{employeeName\}\}/g, contract.employeeName)
      .replace(/\{\{employeeId\}\}/g, contract.employeeId.slice(0, 8))
      .replace(/\{\{contractEndDate\}\}/g, endDate.toLocaleDateString('zh-CN'));

    // 生成HTML邮件正文
    let body = template?.body || `<div style="font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #333; line-height: 1.8; padding: 20px;">
  <p>Hi {{managerName}}，</p>
  <p>员工 <strong>{{employeeName}}</strong>（工号：<code>{{employeeId}}</code>）的劳动合同将于 <strong style="color: #e74c3c;">{{contractEndDate}}</strong> 到期（剩余 <strong>{{daysLeft}}</strong> 天）。</p>
  <p>为确保合同续签流程按时完成，请您确认以下事项：</p>
  <ol>
    <li>是否同意续签：续签 / 不续签 / 需进一步讨论</li>
    <li>如续签，请完成《合同续签申请表》中的部门填写及签字</li>
    <li>请安排员工完成本人确认及签字</li>
    <li>如不续签，请先与 HRBP/RP 沟通确认后再提交申请表</li>
  </ol>
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <thead>
      <tr style="background: #f5f5f5;">
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">当前状态</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">负责人</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="border: 1px solid #ddd; padding: 8px;">申请表</td><td style="border: 1px solid #ddd; padding: 8px;">待提交</td></tr>
      <tr><td style="border: 1px solid #ddd; padding: 8px;">1st Level Mgr</td><td style="border: 1px solid #ddd; padding: 8px;">待签署</td></tr>
      <tr><td style="border: 1px solid #ddd; padding: 8px;">2nd Level Mgr</td><td style="border: 1px solid #ddd; padding: 8px;">待签署</td></tr>
      <tr><td style="border: 1px solid #ddd; padding: 8px;">Employee</td><td style="border: 1px solid #ddd; padding: 8px;">待签署</td></tr>
      <tr><td style="border: 1px solid #ddd; padding: 8px;">HR</td><td style="border: 1px solid #ddd; padding: 8px;">待签署</td></tr>
    </tbody>
  </table>
  <p>请于 <strong>{{dueDate}}</strong> 前完成并反馈给 HRS/HRBP。</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
  <p style="font-size: 12px; color: #999;">说明：本提醒由 AI 辅助生成，具体续签决定需由业务经理与 HRBP/RP 按公司流程人工确认。</p>
</div>`;

    body = body
      .replace(/\{\{managerName\}\}/g, '经理')
      .replace(/\{\{employeeName\}\}/g, contract.employeeName)
      .replace(/\{\{employeeId\}\}/g, contract.employeeId.slice(0, 8))
      .replace(/\{\{contractEndDate\}\}/g, endDate.toLocaleDateString('zh-CN'))
      .replace(/\{\{daysLeft\}\}/g, daysLeft.toString())
      .replace(/\{\{dueDate\}\}/g, dueDate.toLocaleDateString('zh-CN'))
      .replace(/\{\{department\}\}/g, contract.department || '未指定')
      .replace(/\{\{position\}\}/g, contract.position || '未指定')
      .replace(/\{\{status\}\}/g, contract.status === 'active' ? '待发起' : contract.status);

    const emailPreview = {
      to: 'manager@company.com',
      cc: 'hrbp@company.com, hrs@company.com',
      subject,
      body,
      reminderType,
      contractInfo: {
        employeeName: contract.employeeName,
        employeeId: contract.employeeId,
        department: contract.department,
        position: contract.position,
        endDate: contract.endDate,
        daysLeft,
        status: contract.status,
      },
    };

    return success(emailPreview);
  } catch (err) {
    console.error('Failed to preview email:', err);
    return error(500, '预览邮件失败');
  }
}
