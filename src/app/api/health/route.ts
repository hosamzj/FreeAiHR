import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'unknown' as string,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';
    return NextResponse.json(health, { status: 200 });
  } catch (err) {
    health.status = 'error';
    health.database = 'disconnected';
    console.error('[Health Check] Database connection failed:', err);
    return NextResponse.json(health, { status: 503 });
  }
}
