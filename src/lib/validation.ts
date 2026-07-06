import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱'),
  password: z.string().min(1, '密码不能为空'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '旧密码不能为空'),
  newPassword: z.string().min(8, '新密码至少 8 位'),
});

export const candidateCreateSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('请输入有效的邮箱').optional(),
  phone: z.string().optional(),
  education: z.string().optional(),
  school: z.string().optional(),
  major: z.string().optional(),
  skills: z.array(z.string()).optional(),
  appliedPosition: z.string().optional(),
  department: z.string().optional(),
  experience: z.number().int().min(0).optional(),
  source: z.string().optional(),
});

export const candidateListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  status: z.string().optional(),
  search: z.string().optional(),
  department: z.string().optional(),
});

export function formatZodErrors(errors: z.ZodIssue[]): string {
  return errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('；');
}

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.issues };
}

export function validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const obj: Record<string, unknown> = {};
  searchParams.forEach((value, key) => {
    obj[key] = value;
  });
  const result = schema.safeParse(obj);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.issues };
}
