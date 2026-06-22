import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'prisma/data/dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create default admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@recruit.ai' },
    update: {},
    create: {
      email: 'admin@recruit.ai',
      name: '系统管理员',
      password: adminPassword,
      role: 'admin',
      department: '技术部',
      position: '系统管理员',
      passwordChangedAt: new Date(),
    },
  });

  // Create HR manager
  const hrPassword = await bcrypt.hash('Hr@12345', 10);
  await prisma.user.upsert({
    where: { email: 'hr@recruit.ai' },
    update: {},
    create: {
      email: 'hr@recruit.ai',
      name: '张经理',
      password: hrPassword,
      role: 'hr_manager',
      department: '人力资源部',
      position: '招聘经理',
      passwordChangedAt: new Date(),
    },
  });

  // Create interviewer
  const interviewerPassword = await bcrypt.hash('Test@1234', 10);
  await prisma.user.upsert({
    where: { email: 'interviewer@recruit.ai' },
    update: {},
    create: {
      email: 'interviewer@recruit.ai',
      name: '李工',
      password: interviewerPassword,
      role: 'interviewer',
      department: '技术部',
      position: '技术面试官',
      passwordChangedAt: new Date(),
    },
  });

  // Create default password policy
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

  // Create default SSO config
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

  // Create sample job positions
  const positions = [
    { title: '高级前端工程师', department: '技术部', location: '北京', salaryMin: 30000, salaryMax: 50000, headcount: 2 },
    { title: '产品经理', department: '产品部', location: '上海', salaryMin: 25000, salaryMax: 40000, headcount: 1 },
    { title: 'UI设计师', department: '设计部', location: '深圳', salaryMin: 20000, salaryMax: 35000, headcount: 1 },
    { title: '后端工程师', department: '技术部', location: '北京', salaryMin: 28000, salaryMax: 45000, headcount: 3 },
    { title: '数据分析师', department: '数据部', location: '杭州', salaryMin: 22000, salaryMax: 38000, headcount: 1 },
  ];

  for (const pos of positions) {
    await prisma.jobPosition.upsert({
      where: { id: `pos-${pos.title}` },
      update: {},
      create: { id: `pos-${pos.title}`, ...pos, status: 'open' },
    });
  }

  // Create sample candidates
  const candidates = [
    { name: '王小明', email: 'wang@example.com', phone: '13800138001', education: '硕士', school: '清华大学', major: '计算机科学', experience: 5, skills: '["React","TypeScript","Node.js","Next.js"]', appliedPosition: '高级前端工程师', department: '技术部', status: 'interviewing', matchScore: 92 },
    { name: '李芳', email: 'lifang@example.com', phone: '13800138002', education: '本科', school: '浙江大学', major: '软件工程', experience: 3, skills: '["Vue","JavaScript","CSS","Webpack"]', appliedPosition: '高级前端工程师', department: '技术部', status: 'screening', matchScore: 78 },
    { name: '张伟', email: 'zhangwei@example.com', phone: '13800138003', education: '硕士', school: '北京大学', major: '人工智能', experience: 4, skills: '["Python","TensorFlow","PyTorch","NLP"]', appliedPosition: '数据分析师', department: '数据部', status: 'new', matchScore: 85 },
    { name: '陈静', email: 'chenjing@example.com', phone: '13800138004', education: '本科', school: '复旦大学', major: '产品设计', experience: 6, skills: '["Figma","Sketch","用户研究","交互设计"]', appliedPosition: 'UI设计师', department: '设计部', status: 'offered', matchScore: 88 },
    { name: '刘强', email: 'liuqiang@example.com', phone: '13800138005', education: '硕士', school: '上海交通大学', major: '软件工程', experience: 7, skills: '["Java","Spring","MySQL","微服务"]', appliedPosition: '后端工程师', department: '技术部', status: 'hired', matchScore: 95 },
  ];

  for (const c of candidates) {
    await prisma.candidate.upsert({
      where: { id: `cand-${c.email}` },
      update: {},
      create: { id: `cand-${c.email}`, ...c },
    });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
