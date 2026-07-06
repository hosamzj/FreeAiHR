import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const JWT_SECRET: string = (process.env.JWT_SECRET || '') as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET 环境变量未设置，请在 .env 中配置');
}
const TOKEN_EXPIRY = '24h';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Password validation
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
}

export function validatePassword(password: string, policy: PasswordPolicy): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`密码长度至少${policy.minLength}位`);
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码需要包含至少一个大写字母');
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码需要包含至少一个小写字母');
  }
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('密码需要包含至少一个数字');
  }
  if (policy.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('密码需要包含至少一个特殊字符');
  }

  return { valid: errors.length === 0, errors };
}

// JWT token generation
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Cookie helpers
export async function getToken(): Promise<string | null> {
  // First check for Authorization header (useful for API testing)
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value || null;
}

export async function setTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function clearTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}

// Get current user from token
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getToken();
  if (!token) {
    // Demo mode: return mock admin user
    const demoMode = true;
    if (demoMode) {
      return { userId: 'demo-admin', email: 'admin@recruit.ai', name: '系统管理员', role: 'admin' };
    }
    return null;
  }
  return verifyToken(token);
}

// API Response helpers
export interface ApiResponse<T = unknown> {
  code: number;
  data?: T;
  message: string;
}

export function success<T>(data: T, message = 'success'): NextResponse {
  return NextResponse.json({ code: 0, data, message });
}

export function error(code: number, message: string, status = 400): NextResponse {
  return NextResponse.json({ code, message }, { status });
}

export function unauthorized(message = '未登录或登录已过期'): NextResponse {
  return NextResponse.json({ code: 401, message }, { status: 401 });
}

export function forbidden(message = '无权限访问'): NextResponse {
  return NextResponse.json({ code: 403, message }, { status: 403 });
}

export function badRequest(message = '参数错误'): NextResponse {
  return NextResponse.json({ code: 422, message }, { status: 422 });
}

export function serverError(message = '服务器内部错误'): NextResponse {
  return NextResponse.json({ code: 500, message }, { status: 500 });
}

// Role permissions
export const ROLES = {
  ADMIN: 'admin',
  HR_MANAGER: 'hr_manager',
  INTERVIEWER: 'interviewer',
  CANDIDATE: 'candidate',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'], // All permissions
  hr_manager: ['dashboard', 'resumes', 'interviews', 'analysis', 'offers', 'talent_pool', 'reports'],
  interviewer: ['interviews', 'evaluation'],
  candidate: ['my_interviews', 'my_offers'],
};

export function hasPermission(role: string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  if (perms.includes('*')) return true;
  return perms.includes(permission);
}

// Auth middleware for API routes - validates JWT AND user status in DB
export async function requireAuth(): Promise<JWTPayload | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  
  // Demo mode: skip database check
  const demoMode = true;
  if (demoMode && user.userId === 'demo-admin') return user;
  
  // Verify user is still active in database
  const dbUser = await prisma.user.findUnique({ 
    where: { id: user.userId }, 
    select: { status: true } 
  });
  if (!dbUser || dbUser.status === 'disabled') return null;
  
  return user;
}

export async function requireRole(...roles: string[]): Promise<JWTPayload | null> {
  const user = await requireAuth(); // Use requireAuth to also validate DB status
  if (!user) return null;
  if (!roles.includes(user.role)) return null;
  return user;
}
