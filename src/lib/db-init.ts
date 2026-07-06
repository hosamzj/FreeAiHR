import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

let initialized = false;

export async function initializeDatabase(): Promise<{ success: boolean; message: string }> {
  if (initialized) {
    return { success: true, message: 'Database already initialized' };
  }

  try {
    // Check if database has any users
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      initialized = true;
      return { success: true, message: 'Database already has data, skipping seed' };
    }

    console.log('[DB Init] Seeding database...');

    // Create default system configs
    await prisma.systemConfig.upsert({
      where: { key: 'company_name' },
      update: {},
      create: { key: 'company_name', value: 'AI智能招聘系统' },
    });

    await prisma.systemConfig.upsert({
      where: { key: 'email_notification' },
      update: {},
      create: { key: 'email_notification', value: 'true' },
    });

    await prisma.passwordPolicy.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecial: true,
        expiryDays: 90,
        historyCount: 5,
      },
    });

    await prisma.sSOConfig.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        enabled: false,
        protocol: 'saml',
        autoProvision: true,
        defaultRole: 'interviewer',
      },
    });

    // Create users
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const hrPassword = await bcrypt.hash('Hr@12345', 10);
    const interviewerPassword = await bcrypt.hash('Test@1234', 10);

    await prisma.user.upsert({
      where: { email: 'admin@recruit.ai' },
      update: {},
      create: {
        email: 'admin@recruit.ai',
        name: '系统管理员',
        password: adminPassword,
        role: 'admin',
        status: 'active',
        passwordChangedAt: new Date(),
      },
    });

    await prisma.user.upsert({
      where: { email: 'hr@recruit.ai' },
      update: {},
      create: {
        email: 'hr@recruit.ai',
        name: '招聘经理',
        password: hrPassword,
        role: 'hr_manager',
        status: 'active',
        passwordChangedAt: new Date(),
      },
    });

    await prisma.user.upsert({
      where: { email: 'interviewer@recruit.ai' },
      update: {},
      create: {
        email: 'interviewer@recruit.ai',
        name: '面试官',
        password: interviewerPassword,
        role: 'interviewer',
        status: 'active',
        passwordChangedAt: new Date(),
      },
    });

    // Create sample positions
    const positions = [
      { title: '高级前端工程师', department: '技术部', status: 'open', headcount: 3 },
      { title: '产品经理', department: '产品部', status: 'open', headcount: 2 },
      { title: 'UI设计师', department: '设计部', status: 'open', headcount: 1 },
      { title: '后端工程师', department: '技术部', status: 'open', headcount: 4 },
      { title: '数据分析师', department: '数据部', status: 'open', headcount: 2 },
    ];
    for (const p of positions) {
      await prisma.jobPosition.create({ data: p });
    }

    // Create email templates
    const templates = [
      {
        name: 'contract_renewal_reminder',
        displayName: '合同续签提醒',
        category: 'contract',
        subject: '【合同续签提醒】{{employeeName}} 劳动合同即将到期',
        body: '<div style="font-family:sans-serif;padding:20px"><h2>合同续签提醒</h2><p>尊敬的 {{managerName}}：</p><p>您部门的 <strong>{{employeeName}}</strong>（工号：{{employeeId}}）的劳动合同将于 <strong>{{contractEndDate}}</strong> 到期。</p><p>请及时评估是否续签，并联系HR部门办理相关手续。</p><hr/><p style="color:#999;font-size:12px">此邮件由AI智能招聘系统自动发送</p></div>',
        variables: JSON.stringify(['employeeName', 'employeeId', 'department', 'position', 'contractEndDate', 'managerName']),
        enabled: true,
      },
      {
        name: 'onboarding_notification',
        displayName: '入职通知',
        category: 'onboarding',
        subject: '【入职通知】{{employeeName}} 新员工入职安排',
        body: '<div style="font-family:sans-serif;padding:20px"><h2>新员工入职通知</h2><p>各位同事：</p><p>新员工 <strong>{{employeeName}}</strong> 将于近期入职 <strong>{{department}}</strong>，担任 <strong>{{position}}</strong> 一职。</p><p>请各部门做好入职接待和培训准备。</p><hr/><p style="color:#999;font-size:12px">此邮件由AI智能招聘系统自动发送</p></div>',
        variables: JSON.stringify(['employeeName', 'employeeId', 'department', 'position']),
        enabled: true,
      },
      {
        name: 'onboarding_training_reminder',
        displayName: '入职培训提醒',
        category: 'onboarding',
        subject: '【培训提醒】{{employeeName}} 入职培训安排',
        body: '<div style="font-family:sans-serif;padding:20px"><h2>入职培训提醒</h2><p>新员工 <strong>{{employeeName}}</strong> 的入职培训即将开始，请做好准备。</p><hr/><p style="color:#999;font-size:12px">此邮件由AI智能招聘系统自动发送</p></div>',
        variables: JSON.stringify(['employeeName', 'department', 'position']),
        enabled: true,
      },
      {
        name: 'onboarding_anomaly_alert',
        displayName: '入职异常提醒',
        category: 'onboarding',
        subject: '【异常提醒】{{employeeName}} 入职流程异常',
        body: '<div style="font-family:sans-serif;padding:20px"><h2>入职流程异常</h2><p>新员工 <strong>{{employeeName}}</strong> 的入职流程存在异常，请及时处理。</p><hr/><p style="color:#999;font-size:12px">此邮件由AI智能招聘系统自动发送</p></div>',
        variables: JSON.stringify(['employeeName', 'department', 'position']),
        enabled: true,
      },
    ];

    for (const t of templates) {
      await prisma.emailTemplate.upsert({
        where: { name: t.name },
        update: {},
        create: t,
      });
    }

    initialized = true;
    console.log('[DB Init] Database seeded successfully');
    return { success: true, message: 'Database seeded successfully' };
  } catch (error) {
    console.error('[DB Init] Failed to seed database:', error);
    return { success: false, message: `Failed to seed database: ${error}` };
  }
}

export async function checkDatabaseHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    await prisma.user.count();
    return { healthy: true, message: 'Database is healthy' };
  } catch (error) {
    return { healthy: false, message: `Database error: ${error}` };
  }
}
