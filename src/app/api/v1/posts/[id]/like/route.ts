import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post, Like } from '@/models';
import { requireUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/lib/api-response';
import mongoose from 'mongoose';

/**
 * POST /api/v1/posts/:id/like
 * Like a post
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
      return apiError('Invalid post ID', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const post = await Post.findOne({ _id: id, deletedAt: null });
    if (!post) return apiNotFound('Post not found');

    const existing = await Like.findOne({ targetType: 'post', targetId: id, userId: user._id });
    if (existing) {
      return apiSuccess({ liked: true, postId: id }, 'Already liked', 200);
    }

    await Like.create({ targetType: 'post', targetId: id, userId: user._id });
    await Post.findByIdAndUpdate(id, { $inc: { likesCount: 1 }, updatedAt: new Date() });

    return apiSuccess({ liked: true, postId: id }, 'Post liked', 201);
  } catch (err) {
    console.error('Like post error:', err);
    return apiError('Failed to like post', 'SERVER_ERROR', 500);
  }
}

/**
 * DELETE /api/v1/posts/:id/like
 * Unlike a post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return apiError('Invalid post ID', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const deleted = await Like.findOneAndDelete({ targetType: 'post', targetId: id, userId: user._id });
    if (deleted) {
      await Post.findByIdAndUpdate(id, { $inc: { likesCount: -1 }, updatedAt: new Date() });
    }

    return apiSuccess({ liked: false, postId: id }, 'Post unliked', 200);
  } catch (err) {
    console.error('Unlike post error:', err);
    return apiError('Failed to unlike post', 'SERVER_ERROR', 500);
  }
}
