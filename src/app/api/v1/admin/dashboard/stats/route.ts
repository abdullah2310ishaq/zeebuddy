import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post } from '@/models';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * GET /api/v1/admin/dashboard/stats
 * Returns news posted, accepted, rejected (with optional date filter)
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const match: Record<string, unknown> = { deletedAt: null };
    if (from || to) {
      match.createdAt = {};
      if (from) (match.createdAt as Record<string, Date>).$gte = new Date(from);
      if (to) (match.createdAt as Record<string, Date>).$lte = new Date(to + 'T23:59:59.999Z');
    }

    const [posted, accepted, rejected] = await Promise.all([
      Post.countDocuments(match),
      Post.countDocuments({ ...match, status: { $in: ['approved', 'published'] } }),
      Post.countDocuments({ ...match, status: 'rejected' }),
    ]);

    return apiSuccess({
      totalPosted: posted,
      totalAccepted: accepted,
      totalRejected: rejected,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return apiError('Failed to fetch stats', 'SERVER_ERROR', 500);
  }
}
