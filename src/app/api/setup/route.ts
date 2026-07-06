import { NextResponse } from 'next/server';
import { initializeDatabase, checkDatabaseHealth } from '@/lib/db-init';

export async function GET() {
  const health = await checkDatabaseHealth();
  return NextResponse.json({
    code: 0,
    data: {
      healthy: health.healthy,
      message: health.message,
    },
  });
}

export async function POST() {
  try {
    const result = await initializeDatabase();
    return NextResponse.json({
      code: result.success ? 0 : 500,
      data: result,
      message: result.message,
    });
  } catch (error) {
    return NextResponse.json(
      {
        code: 500,
        message: `Setup failed: ${error}`,
      },
      { status: 500 }
    );
  }
}
