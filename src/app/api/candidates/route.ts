import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, success, unauthorized, badRequest } from '@/lib/auth';
import { candidateCreateSchema, candidateListQuerySchema, validateQuery, validateBody, formatZodErrors } from '@/lib/validation';
import { safeJsonParse } from '@/lib/json-utils';

// GET /api/candidates
export async function GET(request: NextRequest) {
  const user = await requireRole('admin', 'hr_manager', 'interviewer');
  if (!user) return unauthorized();

  const searchParams = request.nextUrl.searchParams;
  const validation = validateQuery(candidateListQuerySchema, searchParams);
  if (!validation.success) {
    return badRequest(formatZodErrors(validation.errors));
  }
  const { page, pageSize, status, search, department } = validation.data;

  const where: Record<string, unknown> = {};
  if (status) {
    where.status = status;
  } else {
    where.status = { notIn: ['offered', 'hired', 'rejected', 'archived', 'pool'] };
  }
  if (department) where.department = department;
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
      skills: safeJsonParse(c.skills, []),
      tags: safeJsonParse(c.tags, []),
      resumeParsed: safeJsonParse(c.resumeParsed, {}),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

// POST /api/candidates
export async function POST(request: NextRequest) {
  const user = await requireRole('admin', 'hr_manager');
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const validation = validateBody(candidateCreateSchema, body);
    if (!validation.success) {
      return badRequest(formatZodErrors(validation.errors));
    }
    const { name, email, phone, education, school, major, skills, appliedPosition, department, experience, source } = validation.data;

    // Check duplicate
    if (email) {
      const existing = await prisma.candidate.findFirst({ where: { email } });
      if (existing) {
        return badRequest('该候选人邮箱已存在（简历查重）');
      }
    }

    const candidate = await prisma.candidate.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        education: education || null,
        school: school || null,
        major: major || null,
        experience: experience || 0,
        skills: JSON.stringify(skills || []),
        appliedPosition: appliedPosition || null,
        department: department || null,
        status: 'new',
        source: source || 'manual',
        matchScore: Math.floor(Math.random() * 40) + 60, // Simulated AI score
      },
    });

    return success(candidate);
  } catch (err) {
    console.error('Create candidate error:', err);
    return badRequest('创建候选人失败');
  }
}
