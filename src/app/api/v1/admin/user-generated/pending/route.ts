import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post } from '@/models';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * GET /api/v1/admin/user-generated/pending
 * Returns pending user posts for approval
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    await connectDB();

    const posts = await Post.find({
      status: 'pending',
      authorType: 'user',
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .populate('authorId', '_id name email avatarUrl')
      .populate('categoryId', 'name')
      .lean();

    type PopulatedAuthor = { _id: unknown; name: string; email: string; avatarUrl?: string };
    return apiSuccess(
      posts.map((p) => {
        const author = (p as unknown as { authorId?: PopulatedAuthor }).authorId;
        return {
          id: String(p._id),
          title: p.title,
          content: p.content,
          media: p.media,
          postType: p.postType,
          category: (p as unknown as { categoryId?: { name: string } }).categoryId,
          author: author
            ? { id: String(author._id), name: author.name, email: author.email, avatarUrl: author.avatarUrl }
            : undefined,
          createdAt: p.createdAt,
        };
      })
    );
  } catch (err) {
    console.error('Pending posts error:', err);
    return apiError('Failed to fetch pending posts', 'SERVER_ERROR', 500);
  }
}
