import { NextRequest, NextResponse } from 'next/server';
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

    // 获取通知规则
    const rule = await prisma.onboardingNotificationRule.findFirst({
      where: { name: notificationType },
    });

    // 生成邮件内容
    const subject = (rule?.templateSubject || '新员工[EmployeeName]已完成入职办理 - 请安排部门接待')
      .replace(/\[EmployeeName\]/g, onboarding.employeeName);

    let body = rule?.templateBody || `Hi [ManagerName]，

新员工 [EmployeeName]（工号：[EmployeeID]）今日已完成HRS入职办理，可安排部门接待和岗位介绍。

员工信息：
- 姓名：[EmployeeName]
- 工号：[EmployeeID]
- 部门：[Department]
- 职位：[Position]
- 报到地点：[Location]
- 入职日期：[OnboardingDate]
- 手机号码：[EmployeePhone]

请用人部门安排：
1. 部门接待人对接新员工
2. 工位/设备/门禁/系统权限确认
3. 岗位介绍和直属主管沟通
4. 部门 7-30-60-90 天在岗培训计划安排

如发现员工未到岗、信息不符或接待安排有问题，请及时反馈HRBP/RP和HRS。

说明：本通知由AI辅助生成，入职状态以HRS系统记录为准。`;

    body = body
      .replace(/\[ManagerName\]/g, '经理')
      .replace(/\[EmployeeName\]/g, onboarding.employeeName)
      .replace(/\[EmployeeID\]/g, onboarding.candidateId.slice(0, 8))
      .replace(/\[Department\]/g, onboarding.department || '未指定')
      .replace(/\[Position\]/g, onboarding.position || '未指定')
      .replace(/\[Location\]/g, '公司总部')
      .replace(/\[OnboardingDate\]/g, new Date(onboarding.startDate).toLocaleDateString('zh-CN'))
      .replace(/\[EmployeePhone\]/g, '请联系HR获取');

    // 根据通知类型调整内容
    if (notificationType === 'training_reminder') {
      body = body.replace('部门接待', '培训安排');
    } else if (notificationType === 'anomaly_alert') {
      body = `Hi，

【异常提醒】新员工 ${onboarding.employeeName} 的入职信息存在以下异常：

异常项：入职任务待完成

员工信息：
- 姓名：${onboarding.employeeName}
- 部门：${onboarding.department || '未指定'}

请及时核实并处理，确保入职流程正常进行。

说明：本提醒由AI辅助生成。`;
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
        status: onboarding.status,
      },
      recipients: rule ? JSON.parse(rule.recipientTypes || '[]') : ['manager'],
    };

    return success(emailPreview);
  } catch (err) {
    console.error('Failed to preview email:', err);
    return error(500, '预览邮件失败');
  }
}
