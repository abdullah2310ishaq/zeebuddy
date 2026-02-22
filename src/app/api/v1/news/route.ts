import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post } from '@/models';
import { apiSuccess, apiError } from '@/lib/api-response';
import { Types } from 'mongoose';

/**
 * GET /api/v1/news
 * News feed for user app - approved/published posts only, paginated
 * Query: limit, offset, categoryId
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
    const categoryId = searchParams.get('categoryId');

    const query: Record<string, unknown> = {
      status: { $in: ['published', 'approved'] },
      deletedAt: null,
    };

    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      query.categoryId = new Types.ObjectId(categoryId);
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('categoryId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Post.countDocuments(query),
    ]);

    return apiSuccess({
      data: posts,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error('News feed error:', err);
    return apiError('Failed to fetch news', 'SERVER_ERROR', 500);
  }
}
