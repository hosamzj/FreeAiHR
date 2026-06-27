import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Token verification helper - matches logic in src/lib/auth.ts
function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/resumes',
  '/interviews',
  '/analysis',
  '/offers',
  '/users',
  '/settings',
  '/candidate-pool',
  '/positions',
  '/reports',
  '/templates',
  '/contracts',
  '/onboarding',
  '/collection',
  '/change-password',
];

// Admin-only routes
const ADMIN_ROUTES = ['/users', '/settings'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (!isProtected) {
    return NextResponse.next();
  }

  // Get auth token from cookie
  const token = request.cookies.get('auth_token')?.value;
  const user = token ? verifyToken(token) : null;

  // Not authenticated - redirect to login
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin-only routes
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  if (isAdminRoute && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/403', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
