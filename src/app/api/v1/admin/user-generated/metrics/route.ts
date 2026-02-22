import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post, User } from '@/models';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * GET /api/v1/admin/user-generated/metrics
 * Returns overall users %, total posts, live posts
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    await connectDB();

    const [totalUsers, totalPosts, livePosts] = await Promise.all([
      User.countDocuments({ role: 'user', deletedAt: null }),
      Post.countDocuments({ authorType: 'user', deletedAt: null }),
      Post.countDocuments({
        authorType: 'user',
        status: { $in: ['approved', 'published'] },
        deletedAt: null,
      }),
    ]);

    const userContributionPercent = totalUsers > 0 ? Math.round((livePosts / totalUsers) * 100) : 0;

    return apiSuccess({
      totalUsers,
      totalPosts,
      livePosts,
      userContributionPercent,
    });
  } catch (err) {
    console.error('Metrics error:', err);
    return apiError('Failed to fetch metrics', 'SERVER_ERROR', 500);
  }
}
