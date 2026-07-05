// Mock data for the AI Recruitment Management System

export interface Candidate {
  id: string;
  name: string;
  avatar: string;
  avatarColor?: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  education: string;
  school: string;
  major: string;
  experience: number;
  skills: string[];
  matchScore: number;
  status: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'archived';
  resumeUrl?: string;
  tags: string[];
  appliedAt: string;
  source: string;
  workHistory: WorkHistory[];
  aiSummary?: string;
  matchedSkills: string[];
  unmatchedSkills: string[];
  isAIRecommended?: boolean;
}

export interface WorkHistory {
  company: string;
  position: string;
  duration: string;
  description: string;
}

export interface InterviewerSkill {
  id: string;
  name: string;
  avatar: string;
  department: string;
  skills: string[];
  title: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  position: string;
  interviewerId: string;
  interviewerName: string;
  type: 'first' | 'second' | 'final' | 'technical';
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  room: string;
  meetingLink?: string;
  rating?: InterviewRating;
  aiQuestions?: string[];
  aiSuggestion?: string;
}

export interface InterviewRating {
  professionalSkill: number;
  communication: number;
  cultureFit: number;
  problemSolving: number;
  teamwork: number;
  overall: number;
  comment: string;
  aiComment: string;
}

export interface Offer {
  id: string;
  candidateId: string;
  candidateName: string;
  position: string;
  department: string;
  salary: {
    min: number;
    max: number;
    offered: number;
  };
  status: 'draft' | 'pending' | 'approved' | 'sent' | 'accepted' | 'declined';
  createdAt: string;
  expiresAt: string;
  approver: string;
  aiRecommendation: string;
  benefits: string[];
}

export interface JobPosition {
  id: string;
  title: string;
  department: string;
  requiredSkills: string[];
  salaryRange: { min: number; max: number };
  status: 'open' | 'closed' | 'paused';
  applicants: number;
  hired: number;
}

// Mock Candidates
export const mockCandidates: Candidate[] = [
  {
    id: 'c1',
    name: '张明远',
    avatar: 'ZM',
    email: 'zhangmy@email.com',
    phone: '138****5678',
    position: '高级前端工程师',
    department: '技术部',
    education: '硕士',
    school: '浙江大学',
    major: '计算机科学',
    experience: 5,
    skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Webpack', 'Tailwind CSS'],
    matchScore: 92,
    status: 'interview',
    tags: ['AI推荐', '高匹配'],
    avatarColor: 'bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-sky-400 border border-sky-500/20',
    isAIRecommended: true,
    appliedAt: '2024-01-15',
    source: 'Boss直聘',
    workHistory: [
      { company: '字节跳动', position: '前端工程师', duration: '2021-2024', description: '负责抖音电商前端架构设计与性能优化' },
      { company: '阿里巴巴', position: '前端开发', duration: '2019-2021', description: '参与淘宝营销活动页面开发' },
    ],
    aiSummary: '候选人具有丰富的大厂前端开发经验，技术栈高度匹配，在React生态和性能优化方面有深入实践。推荐进入面试环节。',
    matchedSkills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Tailwind CSS'],
    unmatchedSkills: ['Vue.js'],
  },
  {
    id: 'c2',
    name: '李思雨',
    avatar: 'LS',
    email: 'lisy@email.com',
    phone: '139****1234',
    position: '产品经理',
    department: '产品部',
    education: '本科',
    school: '北京大学',
    major: '信息管理',
    experience: 4,
    skills: ['产品规划', '数据分析', '用户研究', 'Axure', 'SQL', '项目管理'],
    matchScore: 87,
    status: 'screening',
    tags: ['AI推荐', '经验丰富'],
    avatarColor: 'bg-gradient-to-br from-violet-500/20 to-purple-600/20 text-violet-400 border border-violet-500/20',
    isAIRecommended: true,
    appliedAt: '2024-01-16',
    source: '猎聘',
    workHistory: [
      { company: '腾讯', position: '产品经理', duration: '2021-2024', description: '负责微信支付商户端产品规划与迭代' },
      { company: '美团', position: '产品专员', duration: '2020-2021', description: '参与外卖商家端功能设计' },
    ],
    aiSummary: '候选人具备扎实的产品思维和数据分析能力，在支付和商户领域有丰富经验，与岗位需求高度匹配。',
    matchedSkills: ['产品规划', '数据分析', '用户研究', 'SQL', '项目管理'],
    unmatchedSkills: ['技术背景'],
  },
  {
    id: 'c3',
    name: '王浩然',
    avatar: 'WH',
    email: 'wanghr@email.com',
    phone: '137****9876',
    position: '高级前端工程师',
    department: '技术部',
    education: '本科',
    school: '华中科技大学',
    major: '软件工程',
    experience: 3,
    skills: ['Vue.js', 'React', 'JavaScript', 'CSS', 'Git', 'Docker'],
    matchScore: 75,
    status: 'new',
    tags: ['待评估'],
    avatarColor: 'bg-gradient-to-br from-emerald-500/20 to-green-600/20 text-emerald-400 border border-emerald-500/20',
    isAIRecommended: false,
    appliedAt: '2024-01-17',
    source: '拉勾网',
    workHistory: [
      { company: '网易', position: '前端开发', duration: '2021-2024', description: '负责网易云音乐Web端开发' },
    ],
    aiSummary: '候选人具有中等匹配度，Vue.js经验丰富但React经验相对较少，建议进一步评估学习能力。',
    matchedSkills: ['React', 'JavaScript', 'CSS'],
    unmatchedSkills: ['TypeScript', 'Next.js', 'Node.js'],
  },
  {
    id: 'c4',
    name: '陈雨桐',
    avatar: 'CY',
    email: 'chenyt@email.com',
    phone: '136****4321',
    position: 'UI/UX设计师',
    department: '设计部',
    education: '硕士',
    school: '中央美术学院',
    major: '数字媒体设计',
    experience: 4,
    skills: ['Figma', 'Sketch', '设计系统', '交互设计', '用户研究', 'Principle'],
    matchScore: 95,
    status: 'offer',
    tags: ['AI推荐', '高匹配', '优秀'],
    avatarColor: 'bg-gradient-to-br from-orange-500/20 to-amber-600/20 text-orange-400 border border-orange-500/20',
    isAIRecommended: true,
    appliedAt: '2024-01-10',
    source: '站酷',
    workHistory: [
      { company: '蚂蚁集团', position: '高级设计师', duration: '2021-2024', description: '负责支付宝设计系统建设与组件库维护' },
      { company: '小红书', position: 'UI设计师', duration: '2020-2021', description: '参与社区模块视觉设计' },
    ],
    aiSummary: '候选人设计能力出众，具有完整的设计系统建设经验，审美与产品理解力俱佳，强烈推荐录用。',
    matchedSkills: ['Figma', '设计系统', '交互设计', '用户研究'],
    unmatchedSkills: [],
  },
  {
    id: 'c5',
    name: '刘子轩',
    avatar: 'LZ',
    email: 'liuzx@email.com',
    phone: '135****7890',
    position: '后端工程师',
    department: '技术部',
    education: '硕士',
    school: '清华大学',
    major: '计算机科学',
    experience: 6,
    skills: ['Go', 'Python', 'Kubernetes', 'MySQL', 'Redis', '微服务'],
    matchScore: 88,
    status: 'interview',
    tags: ['AI推荐', '技术强'],
    avatarColor: 'bg-gradient-to-br from-pink-500/20 to-rose-600/20 text-pink-400 border border-pink-500/20',
    isAIRecommended: true,
    appliedAt: '2024-01-14',
    source: '脉脉',
    workHistory: [
      { company: '华为', position: '后端架构师', duration: '2020-2024', description: '负责云原生平台后端架构设计' },
      { company: '百度', position: '后端工程师', duration: '2018-2020', description: '参与搜索引擎后端服务开发' },
    ],
    aiSummary: '候选人技术功底扎实，在分布式系统和云原生领域有深厚积累，具备架构设计能力。',
    matchedSkills: ['Go', 'Python', 'Kubernetes', 'MySQL', 'Redis', '微服务'],
    unmatchedSkills: [],
  },
  {
    id: 'c6',
    name: '赵晓晴',
    avatar: 'ZX',
    email: 'zhaoxq@email.com',
    phone: '133****2468',
    position: '高级前端工程师',
    department: '技术部',
    education: '本科',
    school: '武汉大学',
    major: '软件工程',
    experience: 4,
    skills: ['React', 'TypeScript', 'Redux', 'Jest', 'CI/CD', '性能优化'],
    matchScore: 83,
    status: 'screening',
    tags: ['潜力股'],
    avatarColor: 'bg-gradient-to-br from-cyan-500/20 to-teal-600/20 text-cyan-400 border border-cyan-500/20',
    isAIRecommended: false,
    appliedAt: '2024-01-18',
    source: 'Boss直聘',
    workHistory: [
      { company: '快手', position: '前端工程师', duration: '2021-2024', description: '负责快手创作者平台前端开发' },
    ],
    aiSummary: '候选人前端基础扎实，有测试驱动开发经验，工程化思维好，建议进一步面试评估。',
    matchedSkills: ['React', 'TypeScript', 'Jest'],
    unmatchedSkills: ['Next.js', 'Node.js', 'Tailwind CSS'],
  },
  {
    id: 'c7',
    name: '孙博文',
    avatar: 'SB',
    email: 'sunbw@email.com',
    phone: '131****3579',
    position: '数据分析师',
    department: '数据部',
    education: '硕士',
    school: '复旦大学',
    major: '统计学',
    experience: 3,
    skills: ['Python', 'SQL', 'Tableau', '机器学习', '统计分析', 'Spark'],
    matchScore: 79,
    status: 'new',
    tags: ['待评估'],
    avatarColor: 'bg-gradient-to-br from-indigo-500/20 to-blue-600/20 text-indigo-400 border border-indigo-500/20',
    isAIRecommended: false,
    appliedAt: '2024-01-19',
    source: '智联招聘',
    workHistory: [
      { company: '京东', position: '数据分析师', duration: '2021-2024', description: '负责供应链数据分析与预测模型建设' },
    ],
    aiSummary: '候选人数据分析能力较强，统计学背景扎实，但业务理解深度有待验证。',
    matchedSkills: ['Python', 'SQL', 'Tableau', '统计分析'],
    unmatchedSkills: ['业务理解', '沟通表达'],
  },
  {
    id: 'c8',
    name: '周子涵',
    avatar: 'ZZ',
    email: 'zhouzh@email.com',
    phone: '132****8642',
    position: '产品经理',
    department: '产品部',
    education: '本科',
    school: '上海交通大学',
    major: '工业设计',
    experience: 5,
    skills: ['B端产品', 'SaaS', '需求分析', '原型设计', '数据驱动', '敏捷开发'],
    matchScore: 91,
    status: 'interview',
    tags: ['AI推荐', 'B端专家'],
    avatarColor: 'bg-gradient-to-br from-amber-500/20 to-yellow-600/20 text-amber-400 border border-amber-500/20',
    isAIRecommended: true,
    appliedAt: '2024-01-12',
    source: '猎聘',
    workHistory: [
      { company: '钉钉', position: '高级产品经理', duration: '2021-2024', description: '负责钉钉项目管理模块产品规划' },
      { company: '用友', position: '产品经理', duration: '2019-2021', description: '参与ERP系统产品迭代' },
    ],
    aiSummary: '候选人在B端SaaS产品领域经验丰富，对企业管理场景理解深刻，与岗位需求高度契合。',
    matchedSkills: ['B端产品', 'SaaS', '需求分析', '原型设计', '数据驱动', '敏捷开发'],
    unmatchedSkills: [],
  },
];

// Mock Interviewers
export const mockInterviewers: InterviewerSkill[] = [
  { id: 'i1', name: '陈技术', avatar: 'CJ', department: '技术部', skills: ['React', 'TypeScript', '系统设计', '前端架构'], title: '技术总监' },
  { id: 'i2', name: '王产品', avatar: 'WP', department: '产品部', skills: ['产品思维', '业务理解', '用户研究', '数据分析'], title: '产品VP' },
  { id: 'i3', name: '李设计', avatar: 'LS', department: '设计部', skills: ['UI设计', '交互设计', '设计系统', '品牌设计'], title: '设计主管' },
  { id: 'i4', name: '赵HR', avatar: 'ZH', department: '人力资源部', skills: ['人才评估', '文化匹配', '薪酬谈判', '职业规划'], title: 'HRBP' },
  { id: 'i5', name: '刘后端', avatar: 'LH', department: '技术部', skills: ['Go', 'Python', '分布式系统', '数据库'], title: '后端架构师' },
];

// Mock Interviews
export const mockInterviews: Interview[] = [
  {
    id: 'int1',
    candidateId: 'c1',
    candidateName: '张明远',
    position: '高级前端工程师',
    interviewerId: 'i1',
    interviewerName: '陈技术',
    type: 'technical',
    scheduledAt: '2024-01-22 14:00',
    duration: 60,
    status: 'scheduled',
    room: '会议室A301',
    meetingLink: 'https://meet.example.com/abc123',
    aiQuestions: [
      '请描述你在字节跳动期间最复杂的前端架构设计案例',
      'React 18 的 Concurrent Mode 在实际项目中如何应用？',
      '如何设计一个高性能的虚拟滚动列表？',
      '微前端架构的优缺点及落地经验？',
    ],
  },
  {
    id: 'int2',
    candidateId: 'c5',
    candidateName: '刘子轩',
    position: '后端工程师',
    interviewerId: 'i5',
    interviewerName: '刘后端',
    type: 'first',
    scheduledAt: '2024-01-22 10:00',
    duration: 45,
    status: 'scheduled',
    room: '会议室B202',
    aiQuestions: [
      '请介绍你在华为云原生平台的架构设计方案',
      'Go 语言中 goroutine 的调度原理是什么？',
      '如何设计一个高可用的分布式缓存系统？',
    ],
  },
  {
    id: 'int3',
    candidateId: 'c8',
    candidateName: '周子涵',
    position: '产品经理',
    interviewerId: 'i2',
    interviewerName: '王产品',
    type: 'second',
    scheduledAt: '2024-01-23 15:00',
    duration: 60,
    status: 'scheduled',
    room: '会议室C101',
    aiQuestions: [
      '请分享一个你主导的B端产品从0到1的案例',
      '如何平衡不同业务方的需求优先级？',
      'SaaS产品的定价策略你是如何思考的？',
    ],
  },
  {
    id: 'int4',
    candidateId: 'c1',
    candidateName: '张明远',
    position: '高级前端工程师',
    interviewerId: 'i4',
    interviewerName: '赵HR',
    type: 'final',
    scheduledAt: '2024-01-20 11:00',
    duration: 30,
    status: 'completed',
    room: '线上面试',
    rating: {
      professionalSkill: 9,
      communication: 8,
      cultureFit: 9,
      problemSolving: 9,
      teamwork: 8,
      overall: 88,
      comment: '技术能力突出，沟通表达清晰，文化匹配度高。',
      aiComment: '候选人在专业技能和团队文化匹配方面表现优秀，建议推进至Offer环节。薪酬建议参考市场P75分位。',
    },
  },
];

// Mock Offers
export const mockOffers: Offer[] = [
  {
    id: 'o1',
    candidateId: 'c4',
    candidateName: '陈雨桐',
    position: 'UI/UX设计师',
    department: '设计部',
    salary: { min: 30000, max: 45000, offered: 38000 },
    status: 'pending',
    createdAt: '2024-01-18',
    expiresAt: '2024-02-18',
    approver: '张总',
    aiRecommendation: '基于候选人出色的设计能力、丰富的设计系统建设经验以及面试中的优异表现，建议给予P7级别Offer，薪酬位于市场P75分位。该候选人在Figma、设计系统方面有深厚积累，预期能快速融入团队并推动设计标准化建设。',
    benefits: ['五险一金', '弹性工作', '年度体检', '股票期权', '学习基金'],
  },
  {
    id: 'o2',
    candidateId: 'c1',
    candidateName: '张明远',
    position: '高级前端工程师',
    department: '技术部',
    salary: { min: 35000, max: 50000, offered: 42000 },
    status: 'approved',
    createdAt: '2024-01-19',
    expiresAt: '2024-02-19',
    approver: '李总',
    aiRecommendation: '候选人技术能力突出，5年大厂经验，在React生态和性能优化方面有深入实践。建议给予P7级别Offer，薪酬位于市场P75分位。预期能承担核心模块架构设计工作。',
    benefits: ['五险一金', '弹性工作', '年度体检', '股票期权', '技术书籍基金'],
  },
  {
    id: 'o3',
    candidateId: 'c8',
    candidateName: '周子涵',
    position: '产品经理',
    department: '产品部',
    salary: { min: 30000, max: 45000, offered: 0 },
    status: 'draft',
    createdAt: '2024-01-20',
    expiresAt: '2024-02-20',
    approver: '王总',
    aiRecommendation: '候选人在B端SaaS领域经验丰富，对企业管理场景理解深刻。建议给予高级产品经理级别Offer，薪酬参考市场P50-P75区间。待终面完成后确定最终薪酬。',
    benefits: ['五险一金', '弹性工作', '年度体检', '绩效奖金'],
  },
];

// Mock Job Positions
export const mockPositions: JobPosition[] = [
  { id: 'p1', title: '高级前端工程师', department: '技术部', requiredSkills: ['React', 'TypeScript', 'Next.js', 'Node.js'], salaryRange: { min: 35000, max: 50000 }, status: 'open', applicants: 45, hired: 0 },
  { id: 'p2', title: '产品经理', department: '产品部', requiredSkills: ['产品规划', '数据分析', 'B端经验'], salaryRange: { min: 30000, max: 45000 }, status: 'open', applicants: 32, hired: 0 },
  { id: 'p3', title: 'UI/UX设计师', department: '设计部', requiredSkills: ['Figma', '设计系统', '交互设计'], salaryRange: { min: 25000, max: 40000 }, status: 'open', applicants: 28, hired: 0 },
  { id: 'p4', title: '后端工程师', department: '技术部', requiredSkills: ['Go', 'Python', 'Kubernetes'], salaryRange: { min: 35000, max: 55000 }, status: 'open', applicants: 38, hired: 0 },
  { id: 'p5', title: '数据分析师', department: '数据部', requiredSkills: ['Python', 'SQL', 'Tableau'], salaryRange: { min: 25000, max: 40000 }, status: 'open', applicants: 22, hired: 0 },
];

// Dashboard statistics
export const dashboardStats = {
  totalPositions: 12,
  openPositions: 8,
  totalCandidates: 256,
  newThisWeek: 18,
  interviewsThisWeek: 12,
  offersPending: 3,
  hiredThisMonth: 5,
  avgTimeToHire: 23,
  funnel: {
    resume: 256,
    screening: 180,
    interview: 68,
    offer: 22,
    hired: 12,
  },
  departmentStats: [
    { department: '技术部', positions: 5, candidates: 120, interviews: 32, offers: 8, hired: 3 },
    { department: '产品部', positions: 3, candidates: 65, interviews: 18, offers: 5, hired: 1 },
    { department: '设计部', positions: 2, candidates: 42, interviews: 12, offers: 4, hired: 1 },
    { department: '数据部', positions: 2, candidates: 29, interviews: 6, offers: 2, hired: 0 },
  ],
  weeklyTrend: [
    { week: 'W1', resumes: 42, interviews: 8, offers: 2 },
    { week: 'W2', resumes: 38, interviews: 10, offers: 1 },
    { week: 'W3', resumes: 55, interviews: 12, offers: 3 },
    { week: 'W4', resumes: 48, interviews: 9, offers: 2 },
  ],
};

// Recruitment Stats for Dashboard
export const mockRecruitmentStats = [
  { label: '在招岗位', value: '12', change: 8.3, iconKey: 'briefcase', color: 'bg-sky-500/10' },
  { label: '候选人总数', value: '256', change: 12.5, iconKey: 'users', color: 'bg-violet-500/10' },
  { label: '本周面试', value: '18', change: -3.2, iconKey: 'calendar', color: 'bg-emerald-500/10' },
  { label: '待审批Offer', value: '3', change: 0, iconKey: 'filecheck', color: 'bg-amber-500/10' },
  { label: '本月入职', value: '5', change: 25, iconKey: 'trendingup', color: 'bg-orange-500/10' },
  { label: '平均招聘周期', value: '23天', change: -5.1, iconKey: 'clock', color: 'bg-pink-500/10' },
];

export const mockRecruitmentFunnel = [
  { label: '简历收集', value: 256, color: 'bg-gradient-to-r from-sky-500 to-sky-400' },
  { label: 'AI筛选通过', value: 98, color: 'bg-gradient-to-r from-violet-500 to-violet-400' },
  { label: '面试安排', value: 68, color: 'bg-gradient-to-r from-blue-500 to-blue-400' },
  { label: 'Offer发放', value: 22, color: 'bg-gradient-to-r from-orange-500 to-orange-400' },
  { label: '成功入职', value: 12, color: 'bg-gradient-to-r from-emerald-500 to-emerald-400' },
];

export const mockDepartmentStats = [
  { name: '技术部', active: 5, hired: 3, target: 6 },
  { name: '产品部', active: 3, hired: 1, target: 3 },
  { name: '设计部', active: 2, hired: 1, target: 2 },
  { name: '数据部', active: 2, hired: 0, target: 3 },
];

export const mockWeeklyTrend = [
  { week: 'W1', interviews: 12 },
  { week: 'W2', interviews: 18 },
  { week: 'W3', interviews: 15 },
  { week: 'W4', interviews: 22 },
  { week: 'W5', interviews: 19 },
  { week: 'W6', interviews: 25 },
  { week: 'W7', interviews: 21 },
  { week: 'W8', interviews: 28 },
];

export const mockRecentCandidates = mockCandidates.slice(0, 5).map((c, i) => ({
  ...c,
  avatarColor: ['bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-sky-400 border border-sky-500/20',
    'bg-gradient-to-br from-violet-500/20 to-purple-600/20 text-violet-400 border border-violet-500/20',
    'bg-gradient-to-br from-emerald-500/20 to-green-600/20 text-emerald-400 border border-emerald-500/20',
    'bg-gradient-to-br from-orange-500/20 to-amber-600/20 text-orange-400 border border-orange-500/20',
    'bg-gradient-to-br from-pink-500/20 to-rose-600/20 text-pink-400 border border-pink-500/20'][i % 5],
}));

export const mockUpcomingInterviews = mockInterviews.filter(i => i.status === 'scheduled').slice(0, 5);

export const mockParsedResume = {
  name: '赵子龙',
  avatar: 'ZZ',
  position: '高级前端工程师',
  education: '硕士',
  school: '清华大学',
  major: '软件工程',
  experience: 6,
  matchScore: 94,
  workHistory: [
    { company: '美团', position: '前端架构师', duration: '2021-2024', description: '' },
    { company: '京东', position: '高级前端工程师', duration: '2018-2021', description: '' },
  ],
  aiSummary: '候选人拥有6年前端开发经验，在大型互联网公司担任过前端架构师，技术栈与岗位需求高度匹配。在性能优化、工程化和团队管理方面有丰富经验，强烈推荐进入面试环节。',
  matchedSkills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Webpack', '性能优化'],
  unmatchedSkills: ['Vue.js'],
};
