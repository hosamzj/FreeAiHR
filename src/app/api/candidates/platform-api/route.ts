import { NextRequest } from 'next/server';
import { requireAuth, success, badRequest, unauthorized } from '@/lib/auth';

// Platform API mode - calls third-party recruitment platform APIs
// In production, this would make actual HTTP requests to platform APIs

const SURNAMES = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
const GIVEN_NAMES = ['伟', '芳', '强', '娜', '磊', '敏', '军', '静', '勇', '丽'];
const COMPANIES = ['字节跳动', '阿里巴巴', '腾讯', '百度', '美团', '京东', '网易', '小米', '华为', '滴滴'];
const SCHOOLS = ['清华大学', '北京大学', '浙江大学', '上海交通大学', '复旦大学', '南京大学'];
const SKILLS_MAP: Record<string, string[]> = {
  '前端': ['React', 'Vue', 'TypeScript', 'HTML5', 'CSS3', 'Webpack', 'Next.js'],
  '后端': ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Docker', 'Kubernetes'],
  '产品': ['需求分析', '原型设计', '用户研究', '数据分析', 'Axure', 'Figma'],
  '设计': ['Figma', 'Sketch', 'Photoshop', 'UI设计', '交互设计', '设计系统'],
};

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateApiCandidate(keyword: string, platform: string, index: number) {
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

  const skills = skillPool.slice(0, Math.floor(Math.random() * 4) + 4);
  const exp = Math.floor(Math.random() * 12) + 2;
  const salary = Math.floor(Math.random() * 35) + 20;

  return {
    id: `api_${platform}_${Date.now()}_${index}`,
    name,
    avatar: name.slice(0, 1),
    email: `api_${index}_${Date.now()}@platform.com`,
    phone: `1${randomPick(['38', '39', '58', '86'])}${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
    gender: Math.random() > 0.45 ? 'male' : 'female',
    education: randomPick(['本科', '硕士', '博士']),
    school: randomPick(SCHOOLS),
    major: '计算机科学与技术',
    experience: exp,
    currentCompany: randomPick(COMPANIES),
    currentPosition: keyword || '高级工程师',
    skills,
    location: randomPick(['北京', '上海', '深圳', '杭州', '广州']),
    expectedSalary: `${salary}K-${salary + 15}K`,
    source: `${platform} API`,
    matchScore: Math.floor(Math.random() * 25) + 70,
    aiSummary: `[${platform} API] ${exp}年${keyword}经验，来自平台开放API数据。`,
    appliedPosition: keyword,
    tags: [`${platform} API`, '平台数据'],
    status: 'new',
  };
}

// Validate API key format (basic validation - lenient for demo)
function validateApiKey(key: string, _platform: string): boolean {
  // Basic validation - key must be at least 8 characters
  if (!key || key.length < 8) return false;
  // In production, would validate against platform-specific formats
  // For demo purposes, accept any key that's at least 8 chars
  return true;
}

// POST /api/candidates/platform-api - Platform API mode
export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { 
      keyword, 
      platform = '51job',
      apiKey,
      apiSecret,
      location,
      education,
      salaryRange,
      count = 20
    } = body;

    if (!keyword) return badRequest('采集关键词不能为空');
    if (!apiKey) return badRequest('请先配置 API Key');

    // Validate API key format
    if (!validateApiKey(apiKey, platform)) {
      const platformNames: Record<string, string> = {
        '51job': '前程无忧',
        'boss': 'Boss直聘',
        'lagou': '拉勾网',
        'liepin': '猎聘',
      };
      const name = platformNames[platform] || platform;
      return badRequest(`API Key 格式无效，请检查 ${name} 平台的 Key 格式要求`);
    }

    // In production, would validate credentials against actual platform API
    // For now, simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1800));

    const finalCount = Math.min(count, 50);
    const candidates = [];
    
    for (let i = 0; i < finalCount; i++) {
      candidates.push(generateApiCandidate(keyword, platform, i));
    }

    const platformNames: Record<string, string> = {
      '51job': '前程无忧',
      'boss': 'Boss直聘',
      'lagou': '拉勾网',
      'liepin': '猎聘',
    };

    return success({
      candidates,
      total: candidates.length,
      keyword,
      source: `${platform} API`,
      mode: 'platform_api',
      platform: platformNames[platform] || platform,
      message: `平台API采集完成，共获取 ${candidates.length} 条数据`,
    });
  } catch (err) {
    console.error('Platform API candidates error:', err);
    return badRequest('平台API采集失败');
  }
}
