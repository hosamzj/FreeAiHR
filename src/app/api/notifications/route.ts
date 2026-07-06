import { prisma } from '@/lib/prisma';
import { requireAuth, success, unauthorized } from '@/lib/auth';

// GET /api/notifications
export async function GET() {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.userId, read: false },
  });

  return success({ notifications, unreadCount });
}
