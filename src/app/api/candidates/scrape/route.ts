import { NextRequest } from 'next/server';
import { requireAuth, success, badRequest, unauthorized } from '@/lib/auth';

// RPA Scrape mode - simulates web scraping results
// In production, this would call Python scripts via subprocess or a task queue

const SURNAMES = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
const GIVEN_NAMES = ['伟', '芳', '强', '娜', '磊', '敏', '军', '静', '勇', '丽'];
const COMPANIES = ['字节跳动', '阿里巴巴', '腾讯', '百度', '美团', '京东', '网易', '小米'];
const SCHOOLS = ['清华大学', '北京大学', '浙江大学', '上海交通大学', '复旦大学'];
const SKILLS_MAP: Record<string, string[]> = {
  '前端': ['React', 'Vue', 'TypeScript', 'HTML5', 'CSS3', 'Webpack'],
  '后端': ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Docker'],
  '产品': ['需求分析', '原型设计', '用户研究', '数据分析', 'Axure'],
  '设计': ['Figma', 'Sketch', 'Photoshop', 'UI设计', '交互设计'],
};

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateScrapedCandidate(keyword: string, source: string, index: number) {
  const surname = randomPick(SURNAMES);
  const given = randomPick(GIVEN_NAMES);
  const name = surname + given;
  
  let skillPool = SKILLS_MAP['前端'];
  for (const [key, skills] of Object.entries(SKILLS_MAP)) {
    if (keyword.includes(key)) {
      skillPool = skills;
      break;
    }
  }

  const skills = skillPool.slice(0, Math.floor(Math.random() * 3) + 3);
  const exp = Math.floor(Math.random() * 10) + 1;
  const salary = Math.floor(Math.random() * 30) + 15;

  return {
    id: `scrape_${Date.now()}_${index}`,
    name,
    avatar: name.slice(0, 1),
    email: `scraped_${index}_${Date.now()}@example.com`,
    phone: `1${randomPick(['38', '39', '58'])}${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
    gender: Math.random() > 0.5 ? 'male' : 'female',
    education: randomPick(['本科', '硕士']),
    school: randomPick(SCHOOLS),
    major: '计算机科学',
    experience: exp,
    currentCompany: randomPick(COMPANIES),
    currentPosition: keyword || '工程师',
    skills,
    location: randomPick(['北京', '上海', '深圳', '杭州']),
    expectedSalary: `${salary}K-${salary + 10}K`,
    source: `爬虫采集-${source}`,
    matchScore: Math.floor(Math.random() * 30) + 60,
    aiSummary: `[爬虫采集] ${exp}年${keyword}经验，来自${source}平台数据抓取。`,
    appliedPosition: keyword,
    tags: ['爬虫采集', source],
    status: 'new',
  };
}

// POST /api/candidates/scrape - RPA爬虫模式
export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { 
      keyword, 
      source = '51job',
      count = 20,
      scriptType = 'selenium',
      credentials,
      antiCrawl = {}
    } = body;

    if (!keyword) return badRequest('采集关键词不能为空');

    // Validate credentials format (in production, these would be encrypted and validated)
    if (credentials && (!credentials.username || !credentials.password)) {
      return badRequest('登录凭证格式错误：需要 username 和 password');
    }

    const finalCount = Math.min(count, 50);

    // Simulate scraping delay (longer than mock mode)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const candidates = [];
    for (let i = 0; i < finalCount; i++) {
      candidates.push(generateScrapedCandidate(keyword, source, i));
    }

    return success({
      candidates,
      total: candidates.length,
      keyword,
      source: `爬虫采集-${source}`,
      mode: 'rpa',
      scriptType,
      message: `[实验性功能] 爬虫采集完成，共获取 ${candidates.length} 条数据`,
    });
  } catch (err) {
    console.error('Scrape candidates error:', err);
    return badRequest('爬虫采集失败');
  }
}
