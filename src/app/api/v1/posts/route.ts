import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post, Category } from '@/models';
import { requireUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { Types } from 'mongoose';

/**
 * POST /api/v1/posts
 * Create post (image/video) - status pending until admin approves.
 * Body: { title, content?, media: [{ url, type, publicId? }], categoryId, expiryAt? }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    const body = await request.json();
    const { title, content = '', media = [], categoryId, expiryAt } = body;

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

    const expiryAtDate = expiryAt ? new Date(expiryAt) : null;
    if (expiryAtDate && isNaN(expiryAtDate.getTime())) {
      return apiError('Invalid expiryAt date', 'VALIDATION_ERROR', 400);
    }

    const post = await Post.create({
      title: title.trim(),
      content: String(content ?? '').trim(),
      media: mediaArr,
      postType,
      categoryId: new Types.ObjectId(categoryId),
      status: 'pending',
      authorId: user._id,
      authorType: 'user',
      expiryAt: expiryAtDate,
    });

    const populated = await Post.findById(post._id)
      .populate('categoryId', 'name slug')
      .lean();

    return apiSuccess(populated, 'Post submitted for approval', 201);
  } catch (err) {
    console.error('Create post error:', err);
    return apiError('Failed to create post', 'SERVER_ERROR', 500);
  }
}
