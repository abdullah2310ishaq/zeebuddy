import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post, User } from '@/models';
import { requireAdmin } from '@/lib/auth';
import { hasAnyRegisteredPushToken, sendPushToUser } from '@/lib/push-delivery';
import { isPostNotificationsEnabled } from '@/lib/app-settings';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/lib/api-response';
import mongoose from 'mongoose';

/**
 * POST /api/v1/admin/user-generated/:id/decline
 * Declines user post and sends push notification to author.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(request.headers.get('Authorization'));
    if (!adminUser) return apiUnauthorized();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return apiNotFound('Post not found');

    await connectDB();

    const post = await Post.findOneAndUpdate(
      { _id: id, status: 'pending', authorType: 'user', deletedAt: null },
      { status: 'rejected', updatedAt: new Date() },
      { new: true }
    ).lean();

    if (!post) return apiNotFound('Post not found or already processed');

    const author = await User.findOne({ _id: post.authorId, deletedAt: null })
      .select('fcmToken pushTokens notificationSettings')
      .lean();
    const globalEnabled = await isPostNotificationsEnabled();
    if (globalEnabled && hasAnyRegisteredPushToken(author)) {
      const shouldNotify = author?.notificationSettings?.postApprovalRejection !== false;
      if (shouldNotify && author) {
        await sendPushToUser(author, 'Your news was declined', `"${post.title ?? 'Your post'}" could not be published.`, {
          type: 'post_rejected',
          postId: String(post._id),
        });
      }
    }

    return apiSuccess({ message: 'Post declined', post });
  } catch (err) {
    console.error('Decline error:', err);
    return apiError('Failed to decline post', 'SERVER_ERROR', 500);
  }
}
