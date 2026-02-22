import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post, Category } from '@/models';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { Types } from 'mongoose';

/**
 * GET /api/v1/admin/content/posts
 * List admin posts (published + scheduled)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const admin = await requireAdmin(authHeader);
  if (!admin) {
    return apiUnauthorized('Authentication required');
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const status = searchParams.get('status'); // published | scheduled | all

    const query: { authorType: string; status?: { $in: string[] } } = {
      authorType: 'admin',
    };
    if (status === 'published') query.status = { $in: ['published'] };
    else if (status === 'scheduled') query.status = { $in: ['scheduled'] };
    else query.status = { $in: ['published', 'scheduled'] };

    const sortBy = searchParams.get('sort') === 'createdAt' ? { createdAt: -1 } : { updatedAt: -1 };

    const posts = await Post.find(query)
      .populate('categoryId', 'name slug')
      .sort(sortBy)
      .limit(limit)
      .lean();

    return apiSuccess(posts);
  } catch (err) {
    console.error('List posts error:', err);
    return apiError('Failed to list posts', 'SERVER_ERROR', 500);
  }
}

/**
 * POST /api/v1/admin/content/posts
 * Create a new post (news) with images/videos and optional schedule
 * Body: { title, content, media: [{ url, type, publicId }], categoryId, scheduledAt? }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const admin = await requireAdmin(authHeader);
  if (!admin) {
    return apiUnauthorized('Authentication required');
  }

  try {
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

    const status = scheduledAt ? 'scheduled' : 'published';
    const scheduledAtDate = scheduledAt ? new Date(scheduledAt) : null;
    if (scheduledAtDate && isNaN(scheduledAtDate.getTime())) {
      return apiError('Invalid scheduledAt date', 'VALIDATION_ERROR', 400);
    }

    const post = await Post.create({
      title: title.trim(),
      content: String(content ?? '').trim(),
      media: mediaArr,
      postType,
      categoryId: new Types.ObjectId(categoryId),
      status,
      authorId: admin._id,
      authorType: 'admin',
      scheduledAt: scheduledAtDate,
    });

    const populated = await Post.findById(post._id)
      .populate('categoryId', 'name slug')
      .lean();

    return apiSuccess(populated, 'Post created', 201);
  } catch (err) {
    console.error('Create post error:', err);
    return apiError('Failed to create post', 'SERVER_ERROR', 500);
  }
}
