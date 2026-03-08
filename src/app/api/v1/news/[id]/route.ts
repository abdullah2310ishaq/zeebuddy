import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post, Like } from '@/models';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getAuthUser } from '@/lib/auth';
import { Types } from 'mongoose';

interface PopulatedAuthor {
  _id: Types.ObjectId;
  name: string;
  avatarUrl?: string;
}

/**
 * GET /api/v1/news/:id
 * Single news post for user app.
 * When authenticated: adds userLiked. Always includes author (id, name, avatarUrl).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return apiError('Invalid post ID', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const currentUser = await getAuthUser(request.headers.get('Authorization'));

    const post = await Post.findOne({
      _id: id,
      status: { $in: ['published', 'approved'] },
      deletedAt: null,
    })
      .populate('categoryId', 'name slug')
      .populate('authorId', '_id name avatarUrl')
      .lean();

    if (!post) {
      return apiError('Post not found', 'NOT_FOUND', 404);
    }

    const authorDoc = (post as unknown as { authorId?: PopulatedAuthor }).authorId;
    const author =
      authorDoc && typeof authorDoc === 'object' && 'name' in authorDoc
        ? {
            id: String(authorDoc._id),
            name: authorDoc.name,
            avatarUrl: authorDoc.avatarUrl,
          }
        : undefined;

    let userLiked = false;
    if (currentUser) {
      const like = await Like.findOne({
        targetType: 'post',
        targetId: id,
        userId: currentUser._id,
      }).lean();
      userLiked = !!like;
    }

    const { authorId: _omit, ...rest } = post as unknown as Record<string, unknown>;
    return apiSuccess({
      ...rest,
      author,
      userLiked,
    });
  } catch (err) {
    console.error('Get news error:', err);
    return apiError('Failed to fetch news', 'SERVER_ERROR', 500);
  }
}
