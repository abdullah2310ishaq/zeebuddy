import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post, Comment } from '@/models';
import { requireUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/lib/api-response';
import mongoose from 'mongoose';

/**
 * POST /api/v1/comments/:id/reply
 * Reply to a comment. Body: { content: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return apiError('Invalid comment ID', 'VALIDATION_ERROR', 400);
    }

    const body = await request.json();
    const content = typeof body?.content === 'string' ? body.content.trim() : '';

    if (!content) {
      return apiError('content is required', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const parent = await Comment.findOne({ _id: id, deletedAt: null });
    if (!parent) return apiNotFound('Comment not found');

    const comment = await Comment.create({
      postId: parent.postId,
      userId: user._id,
      parentId: id,
      content,
    });

    await Post.findByIdAndUpdate(parent.postId, { $inc: { commentsCount: 1 }, updatedAt: new Date() });

    const populated = await Comment.findById(comment._id)
      .populate('userId', 'name avatarUrl')
      .lean();

    return apiSuccess(populated, 'Reply added', 201);
  } catch (err) {
    console.error('Reply to comment error:', err);
    return apiError('Failed to add reply', 'SERVER_ERROR', 500);
  }
}
