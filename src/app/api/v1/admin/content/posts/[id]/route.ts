import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post, Category } from '@/models';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { Types } from 'mongoose';

/**
 * GET /api/v1/admin/content/posts/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('Authorization');
  const admin = await requireAdmin(authHeader);
  if (!admin) {
    return apiUnauthorized('Authentication required');
  }

  try {
    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return apiError('Invalid post ID', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const post = await Post.findOne({
      _id: id,
      authorType: 'admin',
      deletedAt: null,
    })
      .populate('categoryId', 'name slug')
      .lean();

    if (!post) {
      return apiError('Post not found', 'NOT_FOUND', 404);
    }

    return apiSuccess(post);
  } catch (err) {
    console.error('Get post error:', err);
    return apiError('Failed to fetch post', 'SERVER_ERROR', 500);
  }
}

/**
 * PUT /api/v1/admin/content/posts/:id
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('Authorization');
  const admin = await requireAdmin(authHeader);
  if (!admin) {
    return apiUnauthorized('Authentication required');
  }

  try {
    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return apiError('Invalid post ID', 'VALIDATION_ERROR', 400);
    }

    const body = await request.json();
    const { title, content, media = [], categoryId, scheduledAt } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return apiError('title is required', 'VALIDATION_ERROR', 400);
    }

    if (!categoryId) {
      return apiError('categoryId is required', 'VALIDATION_ERROR', 400);
    }

    if (!Types.ObjectId.isValid(categoryId)) {
      return apiError('Invalid categoryId', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const category = await Category.findById(categoryId);
    if (!category) {
      return apiError('Category not found', 'NOT_FOUND', 404);
    }

    const mediaArr = Array.isArray(media)
      ? media
          .filter((m: unknown) => m && typeof m === 'object' && 'url' in m && 'type' in m)
          .map((m: { url: string; type: string; publicId?: string }) => ({
            url: String(m.url),
            type: m.type === 'video' ? 'video' : 'image',
            publicId: m.publicId ? String(m.publicId) : undefined,
          }))
      : [];

    const hasVideo = mediaArr.some((m: { type: string }) => m.type === 'video');
    const hasImage = mediaArr.some((m: { type: string }) => m.type === 'image');
    const postType = hasVideo ? 'video' : hasImage ? 'image' : 'text';

    const scheduledAtDate = scheduledAt ? new Date(scheduledAt) : null;
    if (scheduledAtDate && isNaN(scheduledAtDate.getTime())) {
      return apiError('Invalid scheduledAt date', 'VALIDATION_ERROR', 400);
    }

    const status = scheduledAtDate ? 'scheduled' : 'published';

    const post = await Post.findOneAndUpdate(
      { _id: id, authorType: 'admin', deletedAt: null },
      {
        title: title.trim(),
        content: String(content ?? '').trim(),
        media: mediaArr,
        postType,
        categoryId: new Types.ObjectId(categoryId),
        status,
        scheduledAt: scheduledAtDate,
      },
      { new: true }
    )
      .populate('categoryId', 'name slug')
      .lean();

    if (!post) {
      return apiError('Post not found', 'NOT_FOUND', 404);
    }

    return apiSuccess(post, 'Post updated');
  } catch (err) {
    console.error('Update post error:', err);
    return apiError('Failed to update post', 'SERVER_ERROR', 500);
  }
}

/**
 * DELETE /api/v1/admin/content/posts/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('Authorization');
  const admin = await requireAdmin(authHeader);
  if (!admin) {
    return apiUnauthorized('Authentication required');
  }

  try {
    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return apiError('Invalid post ID', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const post = await Post.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!post) {
      return apiError('Post not found', 'NOT_FOUND', 404);
    }

    return apiSuccess({ deleted: true }, 'Post deleted');
  } catch (err) {
    console.error('Delete post error:', err);
    return apiError('Failed to delete post', 'SERVER_ERROR', 500);
  }
}
