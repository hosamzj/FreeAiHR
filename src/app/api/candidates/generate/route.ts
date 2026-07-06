import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, success, badRequest, unauthorized } from '@/lib/auth';

// Mock data pools for generating candidates
const SURNAMES = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '高'];
const GIVEN_NAMES_MALE = ['伟', '强', '磊', '军', '勇', '杰', '涛', '明', '辉', '鹏', '飞', '超', '浩', '宇', '博', '峰', '志远', '天成', '子轩', '浩然'];
const GIVEN_NAMES_FEMALE = ['芳', '娜', '敏', '静', '丽', '燕', '霞', '玲', '娟', '倩', '婷', '雪', '琳', '颖', '思琪', '雨萱', '欣怡', '佳琪', '梦瑶', '诗涵'];

const SKILLS_MAP: Record<string, string[]> = {
  '前端': ['React', 'Vue', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Webpack', 'Node.js', 'Next.js', 'Tailwind CSS', 'Redux', 'GraphQL'],
  '后端': ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Microservices', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'RabbitMQ', 'Kafka', 'Go'],
  'Java': ['Java', 'Spring Boot', 'Spring Cloud', 'MySQL', 'Redis', 'MyBatis', 'Maven', 'Docker', '微服务', 'JVM调优'],
  'Python': ['Python', 'Django', 'Flask', 'FastAPI', 'Pandas', 'NumPy', 'Machine Learning', 'TensorFlow', 'PyTorch', 'PostgreSQL'],
  '产品': ['需求分析', '原型设计', '用户研究', '数据分析', 'Axure', 'Figma', '项目管理', 'PRD撰写', '竞品分析', '敏捷开发'],
  '设计': ['Figma', 'Sketch', 'Photoshop', 'Illustrator', 'UI设计', '交互设计', '设计系统', '用户研究', '动效设计', 'Principle'],
  '数据': ['SQL', 'Python', 'Hadoop', 'Spark', 'Hive', '数据仓库', 'ETL', 'Tableau', 'Power BI', '数据建模'],
  '测试': ['自动化测试', 'Selenium', 'Appium', 'JMeter', '性能测试', '接口测试', 'Python', 'Java', 'CI/CD', '测试用例设计'],
  '运营': ['用户运营', '内容运营', '数据分析', '活动策划', '社群运营', 'SEO', 'SEM', '新媒体运营', '用户增长', 'A/B测试'],
};

const COMPANIES = ['字节跳动', '阿里巴巴', '腾讯', '百度', '美团', '京东', '网易', '小米', '华为', '滴滴', '快手', '拼多多', '哔哩哔哩', '携程', '微软中国', '谷歌中国', '亚马逊中国', '蚂蚁集团', '商汤科技', '旷视科技', '理想汽车', '蔚来汽车', '小鹏汽车', '大疆创新', 'OPPO', 'vivo'];

const SCHOOLS = ['清华大学', '北京大学', '浙江大学', '上海交通大学', '复旦大学', '中国科学技术大学', '南京大学', '哈尔滨工业大学', '西安交通大学', '华中科技大学', '武汉大学', '同济大学', '东南大学', '北京航空航天大学', '北京理工大学', '中山大学', '四川大学', '电子科技大学', '天津大学', '南开大学'];

const EDUCATIONS = ['大专', '本科', '硕士', '博士'];
const LOCATIONS = ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '苏州', '长沙', '重庆'];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateName(): string {
  const surname = randomPick(SURNAMES);
  const isMale = Math.random() > 0.4;
  const given = randomPick(isMale ? GIVEN_NAMES_MALE : GIVEN_NAMES_FEMALE);
  return surname + given;
}

function generateCandidate(keyword: string, location: string, education: string, salaryRange: { min: number; max: number }, source: string, index: number): Record<string, unknown> {
  const name = generateName();
  const isMale = !['芳', '娜', '敏', '静', '丽', '燕', '霞', '玲', '娟', '倩', '婷', '雪', '琳', '颖'].some(n => name.includes(n));
  
  // Determine skills based on keyword
  let skillPool: string[] = [];
  for (const [key, skills] of Object.entries(SKILLS_MAP)) {
    if (keyword.includes(key) || key.includes(keyword)) {
      skillPool = skills;
      break;
    }
  }
  if (skillPool.length === 0) {
    skillPool = SKILLS_MAP['前端'] || ['JavaScript', 'React', 'TypeScript'];
  }
  
  const skillCount = randomInt(4, 8);
  const skills: string[] = [];
  const shuffled = [...skillPool].sort(() => Math.random() - 0.5);
  for (let i = 0; i < skillCount && i < shuffled.length; i++) {
    skills.push(shuffled[i]);
  }

  const edu = education || randomPick(EDUCATIONS.filter(e => e !== '大专'));
  const exp = randomInt(1, 15);
  const salary = randomInt(salaryRange.min || 10, salaryRange.max || 50);
  const locationFinal = location || randomPick(LOCATIONS);
  const company = randomPick(COMPANIES);
  const school = randomPick(SCHOOLS);
  const matchScore = randomInt(60, 98);

  return {
    id: `gen_${Date.now()}_${index}`,
    name,
    avatar: name.slice(0, 1),
    email: `${name.toLowerCase().replace(/[\u4e00-\u9fa5]/g, '')}${randomInt(100, 999)}@email.com`,
    phone: `1${randomPick(['38', '39', '58', '59', '86', '87'])}${String(randomInt(10000000, 99999999))}`,
    gender: isMale ? 'male' : 'female',
    education: edu,
    school,
    major: keyword.includes('前端') ? '计算机科学' : keyword.includes('产品') ? '工商管理' : keyword.includes('设计') ? '设计学' : '计算机科学与技术',
    experience: exp,
    currentCompany: company,
    currentPosition: keyword || '工程师',
    skills,
    location: locationFinal,
    expectedSalary: `${salary}K-${salary + randomInt(5, 15)}K`,
    source,
    matchScore,
    aiSummary: `${exp}年${keyword}经验，曾在${company}任职，熟悉${skills.slice(0, 3).join('、')}等技术。${edu}学历，毕业于${school}。`,
    appliedPosition: keyword,
    tags: [source, locationFinal],
    status: 'new',
  };
}

// POST /api/candidates/generate
export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { keyword, location, education, salaryRange, count, source } = body;

    if (!keyword) return badRequest('采集关键词不能为空');

    const finalCount = Math.min(count || 20, 50);
    const finalSalaryRange = salaryRange || { min: 10, max: 50 };
    const finalSource = source || '51job';

    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const candidates: Record<string, unknown>[] = [];
    for (let i = 0; i < finalCount; i++) {
      candidates.push(generateCandidate(keyword, location, education, finalSalaryRange, finalSource, i));
    }

    return success({
      candidates,
      total: candidates.length,
      keyword,
      source: finalSource,
    });
  } catch (err) {
    console.error('Generate candidates error:', err);
    return badRequest('生成候选人数据失败');
  }
}
