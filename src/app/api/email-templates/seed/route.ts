import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// POST /api/email-templates/seed - 初始化默认邮件模板
export async function POST() {
  try {
    await requireAuth();

    const defaultTemplates = [
      {
        name: 'contract_renew',
        displayName: '合同续签提醒',
        category: 'contract',
        subject: '【行动 required】员工{{employeeName}}/{{employeeId}}劳动合同续签确认 - 合同到期日：{{contractEndDate}}',
        body: `<div style="font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #333; line-height: 1.8; padding: 20px;">
  <p>Hi {{managerName}}，</p>
  <p>员工 <strong>{{employeeName}}</strong>（工号：<code>{{employeeId}}</code>）的劳动合同将于 <strong style="color: #e74c3c;">{{contractEndDate}}</strong> 到期（剩余 <strong>{{daysLeft}}</strong> 天）。</p>
  <p>为确保合同续签流程按时完成，请您确认以下事项：</p>
  <ol>
    <li>是否同意续签：续签 / 不续签 / 需进一步讨论</li>
    <li>如续签，请完成《合同续签申请表》中的部门填写及签字</li>
    <li>请安排员工完成本人确认及签字</li>
    <li>如不续签，请先与 HRBP/RP 沟通确认后再提交申请表</li>
  </ol>
  <p>请于 <strong>{{dueDate}}</strong> 前完成并反馈给 HRS/HRBP。</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
  <p style="font-size: 12px; color: #999;">说明：本提醒由 AI 辅助生成，具体续签决定需由业务经理与 HRBP/RP 按公司流程人工确认。</p>
</div>`,
        variables: JSON.stringify(['employeeName', 'employeeId', 'contractEndDate', 'daysLeft', 'dueDate', 'managerName', 'department', 'position']),
      },
      {
        name: 'onboarding_notice',
        displayName: '入职通知',
        category: 'onboarding',
        subject: '新员工{{employeeName}}已完成入职办理 - 请安排部门接待',
        body: `<div style="font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #333; line-height: 1.8; padding: 20px;">
  <p>Hi {{managerName}}，</p>
  <p>新员工 <strong>{{employeeName}}</strong>（工号：<code>{{employeeId}}</code>）今日已完成HRS入职办理，可安排部门接待和岗位介绍。</p>
  <p><strong>员工信息：</strong></p>
  <ul>
    <li>姓名：{{employeeName}}</li>
    <li>工号：{{employeeId}}</li>
    <li>部门：{{department}}</li>
    <li>职位：{{position}}</li>
    <li>入职日期：{{onboardingDate}}</li>
  </ul>
  <p><strong>请用人部门安排：</strong></p>
  <ol>
    <li>部门接待人对接新员工</li>
    <li>工位/设备/门禁/系统权限确认</li>
    <li>岗位介绍和直属主管沟通</li>
    <li>部门 7-30-60-90 天在岗培训计划安排</li>
  </ol>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
  <p style="font-size: 12px; color: #999;">说明：本通知由AI辅助生成，入职状态以HRS系统记录为准。</p>
</div>`,
        variables: JSON.stringify(['employeeName', 'employeeId', 'department', 'position', 'onboardingDate', 'managerName']),
      },
      {
        name: 'onboarding_training',
        displayName: '入职培训提醒',
        category: 'onboarding',
        subject: '新员工{{employeeName}}培训安排通知',
        body: `<div style="font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #333; line-height: 1.8; padding: 20px;">
  <p>Hi 培训负责人，</p>
  <p>新员工 <strong>{{employeeName}}</strong>（部门：{{department}}）已完成入职办理，请安排培训。</p>
  <p>请安排：</p>
  <ol>
    <li>公司文化与制度培训</li>
    <li>岗位技能培训</li>
    <li>安全合规培训</li>
  </ol>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
  <p style="font-size: 12px; color: #999;">本通知由AI辅助生成。</p>
</div>`,
        variables: JSON.stringify(['employeeName', 'department', 'position', 'onboardingDate']),
      },
      {
        name: 'onboarding_anomaly',
        displayName: '入职异常提醒',
        category: 'onboarding',
        subject: '【异常提醒】新员工{{employeeName}}入职信息异常',
        body: `<div style="font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #333; line-height: 1.8; padding: 20px;">
  <p>Hi，</p>
  <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <strong style="color: #856404;">【异常提醒】</strong>
    <p>新员工 <strong>{{employeeName}}</strong> 的入职信息存在异常，请及时核实处理。</p>
  </div>
  <p>员工信息：</p>
  <ul>
    <li>姓名：{{employeeName}}</li>
    <li>部门：{{department}}</li>
  </ul>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
  <p style="font-size: 12px; color: #999;">本提醒由AI辅助生成。</p>
</div>`,
        variables: JSON.stringify(['employeeName', 'department']),
      },
    ];

    for (const tpl of defaultTemplates) {
      await prisma.emailTemplate.upsert({
        where: { name: tpl.name },
        update: {},
        create: tpl,
      });
    }

    return success({ message: '默认邮件模板初始化成功' });
  } catch (e) {
    console.error('Seed email templates error:', e);
    return error(500, '初始化邮件模板失败');
  }
}
