import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post } from '@/models';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * GET /api/v1/admin/dashboard/top-contributors
 * Returns users with most posts (limit 10)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    await connectDB();

    const contributors = await Post.aggregate([
      { $match: { authorType: 'user', deletedAt: null } },
      { $group: { _id: '$authorId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          id: '$_id',
          name: '$user.name',
          avatar: '$user.avatarUrl',
          postCount: '$count',
        },
      },
    ]);

    return apiSuccess(
      contributors.map((c) => ({
        id: String(c.id ?? c._id),
        name: c.name ?? 'Unknown',
        roleOrStat: `${c.postCount ?? 0} articles`,
        avatar: c.avatar ?? undefined,
      }))
    );
  } catch (err) {
    console.error('Top contributors error:', err);
    return apiError('Failed to fetch contributors', 'SERVER_ERROR', 500);
  }
}
