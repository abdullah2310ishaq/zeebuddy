import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post, Comment } from '@/models';
import { requireUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/lib/api-response';
import mongoose from 'mongoose';

/**
 * GET /api/v1/posts/:id/comments
 * Get comments for a post (with replies). Query: limit, offset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return apiError('Invalid post ID', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const post = await Post.findOne({ _id: id, deletedAt: null });
    if (!post) return apiNotFound('Post not found');

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const topLevel = await Comment.find({ postId: id, parentId: null, deletedAt: null })
      .populate('userId', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const topIds = topLevel.map((c) => c._id);
    const replies = await Comment.find({ postId: id, parentId: { $in: topIds }, deletedAt: null })
      .populate('userId', 'name avatarUrl')
      .sort({ createdAt: 1 })
      .lean();

    const replyMap = new Map<string, unknown[]>();
    for (const r of replies) {
      const pid = String((r as { parentId?: unknown }).parentId);
      if (!replyMap.has(pid)) replyMap.set(pid, []);
      replyMap.get(pid)!.push(r);
    }

    const comments = topLevel.map((c) => ({
      ...c,
      replies: replyMap.get(String(c._id)) ?? [],
    }));

    return apiSuccess({ data: comments, total: await Comment.countDocuments({ postId: id, parentId: null, deletedAt: null }) });
  } catch (err) {
    console.error('Get comments error:', err);
    return apiError('Failed to fetch comments', 'SERVER_ERROR', 500);
  }
}

/**
 * POST /api/v1/posts/:id/comments
 * Add a top-level comment. Body: { content: string }
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

    const body = await request.json();
    const content = typeof body?.content === 'string' ? body.content.trim() : '';

    if (!content) {
      return apiError('content is required', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const post = await Post.findOne({ _id: id, deletedAt: null });
    if (!post) return apiNotFound('Post not found');

    const comment = await Comment.create({
      postId: id,
      userId: user._id,
      parentId: null,
      content,
    });

    await Post.findByIdAndUpdate(id, { $inc: { commentsCount: 1 }, updatedAt: new Date() });

    const populated = await Comment.findById(comment._id)
      .populate('userId', 'name avatarUrl')
      .lean();

    return apiSuccess(populated, 'Comment added', 201);
  } catch (err) {
    console.error('Add comment error:', err);
    return apiError('Failed to add comment', 'SERVER_ERROR', 500);
  }
}
