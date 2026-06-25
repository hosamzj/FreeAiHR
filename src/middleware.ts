import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

let initTriggered = false;

async function autoInitDatabase() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('[Middleware] Database is empty, triggering auto-init...');
      // Call the setup API to initialize
      const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT 
        ? `https://${process.env.COZE_PROJECT_DOMAIN_DEFAULT}`
        : `http://localhost:${process.env.DEPLOY_RUN_PORT || 5000}`;
      
      await fetch(`${baseUrl}/api/setup`, { method: 'POST' });
    }
  } catch (error) {
    console.error('[Middleware] Auto-init error:', error);
  }
}

export async function middleware(request: NextRequest) {
  // Trigger database initialization on first request
  if (!initTriggered) {
    initTriggered = true;
    // Don't await - let it run in background
    autoInitDatabase().catch(console.error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
