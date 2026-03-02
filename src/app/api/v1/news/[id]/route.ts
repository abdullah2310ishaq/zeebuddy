import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post } from '@/models';
import { apiSuccess, apiError } from '@/lib/api-response';
import { Types } from 'mongoose';

/**
 * GET /api/v1/news/:id
 * Single news post for user app
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

    type PopulatedAuthor = { _id: unknown; name: string; avatarUrl?: string };
    const authorDoc = (post as unknown as { authorId?: PopulatedAuthor }).authorId;
    const author =
      post.authorType === 'user' && authorDoc
        ? { id: String(authorDoc._id), name: authorDoc.name, avatarUrl: authorDoc.avatarUrl }
        : undefined;

    return apiSuccess({ ...post, author });
  } catch (err) {
    console.error('Get news error:', err);
    return apiError('Failed to fetch news', 'SERVER_ERROR', 500);
  }
}
