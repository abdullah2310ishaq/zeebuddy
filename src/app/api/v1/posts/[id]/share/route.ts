import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post } from '@/models';
import { requireUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/lib/api-response';
import mongoose from 'mongoose';

/**
 * POST /api/v1/posts/:id/share
 * Increment share count for a post
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

    const post = await Post.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $inc: { sharesCount: 1 }, updatedAt: new Date() },
      { new: true }
    ).lean();

    if (!post) return apiNotFound('Post not found');

    return apiSuccess({ postId: id, sharesCount: post.sharesCount }, 'Share recorded', 200);
  } catch (err) {
    console.error('Share post error:', err);
    return apiError('Failed to record share', 'SERVER_ERROR', 500);
  }
}
