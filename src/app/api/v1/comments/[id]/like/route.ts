import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Comment, Like } from '@/models';
import { requireUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/lib/api-response';
import mongoose from 'mongoose';

/**
 * POST /api/v1/comments/:id/like
 * Like a comment (idempotent - already liked returns success)
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

    await connectDB();

    const comment = await Comment.findOne({ _id: id, deletedAt: null });
    if (!comment) return apiNotFound('Comment not found');

    const existing = await Like.findOne({ targetType: 'comment', targetId: id, userId: user._id });
    if (existing) {
      return apiSuccess({ liked: true, commentId: id }, 'Already liked', 200);
    }

    await Like.create({ targetType: 'comment', targetId: id, userId: user._id });
    await Comment.findByIdAndUpdate(id, { $inc: { likesCount: 1 }, updatedAt: new Date() });

    return apiSuccess({ liked: true, commentId: id }, 'Comment liked', 201);
  } catch (err) {
    console.error('Like comment error:', err);
    return apiError('Failed to like comment', 'SERVER_ERROR', 500);
  }
}
