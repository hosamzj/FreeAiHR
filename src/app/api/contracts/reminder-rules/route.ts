import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, error } from '@/lib/auth';

// 默认提醒规则
const defaultRules = [
  {
    name: 'T-45',
    daysBefore: 45,
    recipientTypes: ['manager', 'hrbp', 'hrs'],
    enabled: true,
    templateSubject: '【行动 required】员工[EmployeeName]/[EmployeeID]劳动合同续签确认 - 合同到期日：[EndDate]',
    templateBody: `Hi [ManagerName]，

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

说明：本提醒由 AI 辅助生成，具体续签决定需由业务经理与 HRBP/RP 按公司流程人工确认。`,
  },
  {
    name: 'T-30',
    daysBefore: 30,
    recipientTypes: ['manager', 'hrbp'],
    enabled: true,
    templateSubject: '【二次提醒】员工[EmployeeName]合同续签待确认 - 到期日：[EndDate]',
    templateBody: `Hi [ManagerName]，

这是关于员工 [EmployeeName]（工号：[EmployeeID]）合同续签的二次提醒。

合同到期日：[EndDate]
距到期还有：[DaysLeft] 天

当前状态：待经理确认

请尽快确认续签意向并完成相关流程。如已处理请忽略此提醒。

说明：本提醒由 AI 辅助生成。`,
  },
  {
    name: 'T-15',
    daysBefore: 15,
    recipientTypes: ['manager', 'hrbp', 'hrs'],
    enabled: true,
    templateSubject: '【风险提醒】员工[EmployeeName]合同即将到期 - 续签流程未完成',
    templateBody: `Hi，

【风险提醒】员工 [EmployeeName]（工号：[EmployeeID]）的劳动合同将于 [EndDate] 到期，距今仅剩 [DaysLeft] 天。

当前续签状态：[Status]
未完成项：[PendingItems]

请相关责任人尽快跟进处理，避免合同到期未完成续签的风险。

说明：本提醒由 AI 辅助生成。`,
  },
  {
    name: 'T-7',
    daysBefore: 7,
    recipientTypes: ['hrbp', 'hrs', 'hr_manager'],
    enabled: true,
    templateSubject: '【升级提醒】员工[EmployeeName]合同续签紧急处理',
    templateBody: `Hi，

【升级提醒】员工 [EmployeeName]（工号：[EmployeeID]）的劳动合同将于 [EndDate] 到期，距今仅剩 [DaysLeft] 天，续签流程仍未完成。

当前状态：[Status]
责任人：[ResponsiblePersons]

请立即跟进处理，必要时升级至更高层级。

说明：本提醒由 AI 辅助生成。`,
  },
];

// GET /api/contracts/reminder-rules - 获取提醒规则
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return error(401, '未登录');
    }

    let rules = await prisma.contractReminderRule.findMany({
      orderBy: { daysBefore: 'asc' },
    });

    // 如果没有规则，创建默认规则
    if (rules.length === 0) {
      for (const rule of defaultRules) {
        await prisma.contractReminderRule.create({
          data: {
            name: rule.name,
            daysBefore: rule.daysBefore,
            recipientTypes: JSON.stringify(rule.recipientTypes),
            enabled: rule.enabled,
            templateSubject: rule.templateSubject,
            templateBody: rule.templateBody,
          },
        });
      }
      rules = await prisma.contractReminderRule.findMany({
        orderBy: { daysBefore: 'asc' },
      });
    }

    // 解析 recipientTypes
    const parsedRules = rules.map(rule => ({
      ...rule,
      recipientTypes: JSON.parse(rule.recipientTypes || '[]'),
    }));

    return success(parsedRules);
  } catch (err) {
    console.error('Failed to fetch reminder rules:', err);
    return error(500, '获取提醒规则失败');
  }
}

// PUT /api/contracts/reminder-rules - 更新提醒规则
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

    const rule = await prisma.contractReminderRule.update({
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
    console.error('Failed to update reminder rule:', err);
    return error(500, '更新规则失败');
  }
}
