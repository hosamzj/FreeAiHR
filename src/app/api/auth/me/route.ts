import { success } from '@/lib/auth';
import { clearTokenCookie } from '@/lib/auth';

// POST /api/auth/logout
export async function POST() {
  await clearTokenCookie();
  return success({ message: '已退出登录' });
}

// GET /api/auth/me
export async function GET() {
  const { getCurrentUser } = await import('@/lib/auth');
  const user = await getCurrentUser();
  if (!user) {
    return success({ loggedIn: false, user: null });
  }
  return success({ loggedIn: true, user });
}
