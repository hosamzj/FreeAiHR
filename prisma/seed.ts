import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default system configs
  await prisma.systemConfig.upsert({
    where: { key: 'company_name' },
    update: {},
    create: {
      key: 'company_name',
      value: 'AI智能招聘系统',
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'email_notification' },
    update: {},
    create: {
      key: 'email_notification',
      value: 'true',
    },
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

  const admin = await prisma.user.upsert({
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

  const hr = await prisma.user.upsert({
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

  const interviewer = await prisma.user.upsert({
    where: { email: 'interviewer@recruit.ai' },
    update: {},
    create: {
      email: 'interviewer@recruit.ai',
      name: '技术面试官',
      password: interviewerPassword,
      role: 'interviewer',
      status: 'active',
      passwordChangedAt: new Date(),
    },
  });

  // Create job positions
  const positions = await Promise.all([
    prisma.jobPosition.create({
      data: {
        title: '高级前端工程师',
        department: '技术部',
        status: 'open',
        salaryMin: 30000,
        salaryMax: 50000,
      },
    }),
    prisma.jobPosition.create({
      data: {
        title: '产品经理',
        department: '产品部',
        status: 'open',
        salaryMin: 25000,
        salaryMax: 40000,
      },
    }),
    prisma.jobPosition.create({
      data: {
        title: '后端工程师',
        department: '技术部',
        status: 'open',
        salaryMin: 28000,
        salaryMax: 45000,
      },
    }),
  ]);

  // Create candidates
  const candidates = await Promise.all([
    prisma.candidate.create({
      data: {
        name: '张三',
        email: 'zhangsan@example.com',
        phone: '13800138001',
        status: 'interviewing',
        matchScore: 85,
        appliedPosition: '高级前端工程师',
        department: '技术部',
      },
    }),
    prisma.candidate.create({
      data: {
        name: '李四',
        email: 'lisi@example.com',
        phone: '13800138002',
        status: 'screening',
        matchScore: 72,
        appliedPosition: '产品经理',
        department: '产品部',
      },
    }),
    prisma.candidate.create({
      data: {
        name: '王五',
        email: 'wangwu@example.com',
        phone: '13800138003',
        status: 'offered',
        matchScore: 92,
        appliedPosition: '后端工程师',
        department: '技术部',
      },
    }),
  ]);

  // Create applications (link candidates to positions)
  await Promise.all([
    prisma.application.create({
      data: {
        candidateId: candidates[0].id,
        positionId: positions[0].id,
        status: 'interview',
        matchScore: 85,
      },
    }),
    prisma.application.create({
      data: {
        candidateId: candidates[1].id,
        positionId: positions[1].id,
        status: 'screening',
        matchScore: 72,
      },
    }),
    prisma.application.create({
      data: {
        candidateId: candidates[2].id,
        positionId: positions[2].id,
        status: 'offer',
        matchScore: 92,
      },
    }),
  ]);

  // Create interviews
  await prisma.interview.create({
    data: {
      candidateId: candidates[0].id,
      interviewerId: interviewer.id,
      positionId: positions[0].id,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      duration: 60,
      type: 'technical',
      status: 'scheduled',
    },
  });

  // Create offers
  await prisma.offer.create({
    data: {
      candidateId: candidates[2].id,
      positionId: positions[2].id,
      creatorId: hr.id,
      salaryBase: 38000,
      status: 'pending_approval',
    },
  });

  console.log('Seed data created:');
  console.log(`  - Users: ${admin.email}, ${hr.email}, ${interviewer.email}`);
  console.log(`  - Positions: ${positions.length}`);
  console.log(`  - Candidates: ${candidates.length}`);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
