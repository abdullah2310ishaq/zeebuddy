import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post, User, Category } from '@/models';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * GET /api/v1/admin/user-generated/posts
 * List approved/published user-generated posts for admin (non-deleted).
 * Optional query: limit (default 50, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers.get('Authorization'));
    if (!admin) {
      return apiUnauthorized('Authentication required');
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const posts = await Post.find({
      authorType: 'user',
      status: { $in: ['approved', 'published'] },
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('authorId', 'name email avatarUrl')
      .populate('categoryId', 'name')
      .lean();

    return apiSuccess(
      posts.map((p) => ({
        id: String(p._id),
        title: p.title,
        content: p.content,
        media: p.media,
        postType: p.postType,
        category: (p as unknown as { categoryId?: { name: string } }).categoryId,
        author: (p as unknown as { authorId?: { name: string; email: string; avatarUrl?: string } }).authorId,
        status: p.status,
        createdAt: p.createdAt,
      }))
    );
  } catch (err) {
    console.error('User-generated posts list error:', err);
    return apiError('Failed to fetch user-generated posts', 'SERVER_ERROR', 500);
  }
}

