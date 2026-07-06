import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// 默认通知规则
const defaultRules = [
  {
    name: 'completion_notice',
    triggerCondition: 'HRS Completion Status = 已完成',
    recipientTypes: ['manager', 'mentor'],
    enabled: true,
    templateSubject: '新员工[EmployeeName]已完成入职办理 - 请安排部门接待',
    templateBody: `Hi [ManagerName]，

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

说明：本通知由AI辅助生成，入职状态以HRS系统记录为准。`,
  },
  {
    name: 'training_reminder',
    triggerCondition: 'HRS Completion Status = 已完成',
    recipientTypes: ['trainer'],
    enabled: true,
    templateSubject: '新员工[EmployeeName]入职培训安排提醒',
    templateBody: `Hi 培训专员，

新员工 [EmployeeName]（工号：[EmployeeID]）已完成入职办理，请安排以下培训：

1. E-Learning 课程分配
2. 公司入职培训安排
3. 部门在岗培训协调

员工信息：
- 姓名：[EmployeeName]
- 部门：[Department]
- 职位：[Position]
- 入职日期：[OnboardingDate]

请及时与用人部门沟通，确保培训计划按时执行。

说明：本通知由AI辅助生成。`,
  },
  {
    name: 'anomaly_alert',
    triggerCondition: '合同/体检/工号/地点异常',
    recipientTypes: ['hrbp', 'hrs'],
    enabled: true,
    templateSubject: '【异常提醒】新员工[EmployeeName]入职信息异常',
    templateBody: `Hi，

【异常提醒】新员工 [EmployeeName] 的入职信息存在以下异常：

异常项：[AnomalyItems]

员工信息：
- 姓名：[EmployeeName]
- 工号：[EmployeeID]
- 部门：[Department]

请及时核实并处理，确保入职流程正常进行。

说明：本提醒由AI辅助生成。`,
  },
  {
    name: 'daily_summary',
    triggerCondition: '每日固定时间',
    recipientTypes: ['hrbp', 'hrs'],
    enabled: true,
    templateSubject: '每日入职汇总 - [Date]',
    templateBody: `Hi，

以下是 [Date] 的入职汇总：

【当日完成入职】
[CompletedList]

【待处理】
[PendingList]

【异常记录】
[AnomalyList]

请跟进处理待处理和异常事项。

说明：本汇总由AI辅助生成。`,
  },
];

// GET /api/onboarding/notification-rules - 获取通知规则
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    let rules = await prisma.onboardingNotificationRule.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // 如果没有规则，创建默认规则
    if (rules.length === 0) {
      for (const rule of defaultRules) {
        await prisma.onboardingNotificationRule.create({
          data: {
            name: rule.name,
            triggerCondition: rule.triggerCondition,
            recipientTypes: JSON.stringify(rule.recipientTypes),
            enabled: rule.enabled,
            templateSubject: rule.templateSubject,
            templateBody: rule.templateBody,
          },
        });
      }
      rules = await prisma.onboardingNotificationRule.findMany({
        orderBy: { createdAt: 'asc' },
      });
    }

    // 解析 recipientTypes
    const parsedRules = rules.map(rule => ({
      ...rule,
      recipientTypes: JSON.parse(rule.recipientTypes || '[]'),
    }));

    return success(parsedRules);
  } catch (err) {
    console.error('Failed to fetch notification rules:', err);
    return error(500, '获取通知规则失败');
  }
}

// PUT /api/onboarding/notification-rules - 更新通知规则
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    const body = await request.json();
    const { id, enabled, templateSubject, templateBody, recipientTypes } = body;

    if (!id) {
      return error(422, '缺少规则ID');
    }

    const rule = await prisma.onboardingNotificationRule.update({
      where: { id },
      data: {
        enabled: enabled !== undefined ? enabled : undefined,
        templateSubject: templateSubject || undefined,
        templateBody: templateBody || undefined,
        recipientTypes: recipientTypes ? JSON.stringify(recipientTypes) : undefined,
      },
    });

    return success(rule, '规则更新成功');
  } catch (err) {
    console.error('Failed to update notification rule:', err);
    return error(500, '更新规则失败');
  }
}
