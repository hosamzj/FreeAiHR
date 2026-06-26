import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, success, unauthorized, badRequest } from '@/lib/auth';

// GET /api/candidates
export async function GET(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { appliedPosition: { contains: search } },
    ];
  }

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.candidate.count({ where }),
  ]);

  return success({
    candidates: candidates.map((c) => ({
      ...c,
      skills: JSON.parse(c.skills || '[]'),
      tags: JSON.parse(c.tags || '[]'),
      resumeParsed: JSON.parse(c.resumeParsed || '{}'),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

// POST /api/candidates
export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const {
      name, email, phone, gender, age, location,
      education, workExperience, skills, certificates, languages,
      summary, expectedSalary, expectedPosition, source, status,
    } = body;

    if (!name) return badRequest('姓名不能为空');

    // Check duplicate
    if (email) {
      const existing = await prisma.candidate.findFirst({ where: { email } });
      if (existing) {
        return badRequest('该候选人邮箱已存在（简历查重）');
      }
    }

    // Extract education info
    const topEducation = Array.isArray(education) && education.length > 0 ? education[0] : null;
    const educationStr = topEducation ? `${topEducation.degree || ''} ${topEducation.major || ''}`.trim() : null;
    const schoolStr = topEducation?.school || null;
    
    // Extract work experience
    const workExp = Array.isArray(workExperience) ? workExperience : [];
    const yearsExp = workExp.reduce((total: number, w: { startDate?: string; endDate?: string }) => {
      if (w.startDate && w.endDate) {
        const start = new Date(w.startDate).getFullYear();
        const end = new Date(w.endDate).getFullYear();
        return total + (end - start);
      }
      return total;
    }, 0);
    const currentCompany = workExp.length > 0 ? workExp[workExp.length - 1].company : null;
    const currentPosition = workExp.length > 0 ? workExp[workExp.length - 1].position : null;

    const candidate = await prisma.candidate.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        education: educationStr,
        school: schoolStr,
        experience: yearsExp || 0,
        currentCompany,
        currentPosition,
        skills: JSON.stringify(skills || []),
        appliedPosition: expectedPosition || null,
        source: source || 'ai_parse',
        status: status || 'new',
        aiSummary: summary || null,
        resumeParsed: JSON.stringify({
          name, email, phone, gender, age, location,
          education, workExperience, skills, certificates, languages,
          summary, expectedSalary, expectedPosition,
        }),
      },
    });

    return success(candidate);
  } catch (err) {
    console.error('Create candidate error:', err);
    return badRequest('创建候选人失败');
  }
}
