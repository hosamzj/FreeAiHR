import { prisma } from '@/lib/prisma';
import { requireAuth, success, unauthorized } from '@/lib/auth';

// GET /api/positions
export async function GET() {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const positions = await prisma.jobPosition.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { candidates: true },
      },
    },
  });

  return success(positions);
}
