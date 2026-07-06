import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// GET /api/onboarding/[id]/preview-email - 预览入职通知邮件
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
    const notificationType = searchParams.get('notificationType') || 'completion_notice';

    // 获取入职信息
    const onboarding = await prisma.onboarding.findUnique({
      where: { id },
    });

    if (!onboarding) {
      return error(404, '入职记录不存在');
    }

    // 获取邮件模板
    const templateName = notificationType === 'training_reminder' ? 'onboarding_training' : 
                         notificationType === 'anomaly_alert' ? 'onboarding_anomaly' : 'onboarding_notice';
    const template = await prisma.emailTemplate.findFirst({
      where: { name: templateName, enabled: true },
    });

    // 生成邮件主题
    const subject = (template?.subject || '新员工{{employeeName}}已完成入职办理 - 请安排部门接待')
      .replace(/\{\{employeeName\}\}/g, onboarding.employeeName);

    // 生成HTML邮件正文
    let body = template?.body || `<div style="font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #333; line-height: 1.8; padding: 20px;">
  <p>Hi {{managerName}}，</p>
  <p>新员工 <strong>{{employeeName}}</strong>（工号：<code>{{employeeId}}</code>）今日已完成HRS入职办理，可安排部门接待和岗位介绍。</p>
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <thead>
      <tr style="background: #f5f5f5;">
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;" colspan="2">员工信息</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="border: 1px solid #ddd; padding: 8px; width: 120px; font-weight: 500;">姓名</td><td style="border: 1px solid #ddd; padding: 8px;">{{employeeName}}</td></tr>
      <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: 500;">工号</td><td style="border: 1px solid #ddd; padding: 8px;">{{employeeId}}</td></tr>
      <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: 500;">部门</td><td style="border: 1px solid #ddd; padding: 8px;">{{department}}</td></tr>
      <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: 500;">职位</td><td style="border: 1px solid #ddd; padding: 8px;">{{position}}</td></tr>
      <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: 500;">报到地点</td><td style="border: 1px solid #ddd; padding: 8px;">公司总部</td></tr>
      <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: 500;">入职日期</td><td style="border: 1px solid #ddd; padding: 8px;">{{onboardingDate}}</td></tr>
    </tbody>
  </table>
  <p><strong>请用人部门安排：</strong></p>
  <ol>
    <li>部门接待人对接新员工</li>
    <li>工位/设备/门禁/系统权限确认</li>
    <li>岗位介绍和直属主管沟通</li>
    <li>部门 7-30-60-90 天在岗培训计划安排</li>
  </ol>
  <p>如发现员工未到岗、信息不符或接待安排有问题，请及时反馈HRBP/RP和HRS。</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
  <p style="font-size: 12px; color: #999;">说明：本通知由AI辅助生成，入职状态以HRS系统记录为准。</p>
</div>`;

    body = body
      .replace(/\{\{managerName\}\}/g, '经理')
      .replace(/\{\{employeeName\}\}/g, onboarding.employeeName)
      .replace(/\{\{employeeId\}\}/g, onboarding.candidateId?.slice(0, 8) || 'N/A')
      .replace(/\{\{department\}\}/g, onboarding.department || '未指定')
      .replace(/\{\{position\}\}/g, onboarding.position || '未指定')
      .replace(/\{\{onboardingDate\}\}/g, new Date(onboarding.startDate).toLocaleDateString('zh-CN'));

    // 根据通知类型调整内容
    if (notificationType === 'training_reminder') {
      body = body.replace('部门接待', '培训安排');
    } else if (notificationType === 'anomaly_alert') {
      body = `<div style="font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #333; line-height: 1.8; padding: 20px;">
  <p>Hi，</p>
  <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <strong style="color: #856404;">【异常提醒】</strong>
    <p style="margin: 8px 0;">新员工 <strong>${onboarding.employeeName}</strong> 的入职信息存在以下异常：</p>
    <ul style="margin: 8px 0; padding-left: 20px;">
      <li>入职任务待完成</li>
    </ul>
  </div>
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tbody>
      <tr><td style="border: 1px solid #ddd; padding: 8px; width: 120px; font-weight: 500;">姓名</td><td style="border: 1px solid #ddd; padding: 8px;">${onboarding.employeeName}</td></tr>
      <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: 500;">部门</td><td style="border: 1px solid #ddd; padding: 8px;">${onboarding.department || '未指定'}</td></tr>
    </tbody>
  </table>
  <p>请及时核实并处理，确保入职流程正常进行。</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
  <p style="font-size: 12px; color: #999;">说明：本提醒由AI辅助生成。</p>
</div>`;
    }

    const emailPreview = {
      to: notificationType === 'training_reminder' ? 'trainer@company.com' : 'manager@company.com',
      cc: 'hrbp@company.com, hrs@company.com',
      subject,
      body,
      notificationType,
      employeeInfo: {
        employeeName: onboarding.employeeName,
        department: onboarding.department,
        position: onboarding.position,
        startDate: onboarding.startDate,
      },
    };

    return success(emailPreview);
  } catch (err) {
    console.error('Failed to preview email:', err);
    return error(500, '预览邮件失败');
  }
}
