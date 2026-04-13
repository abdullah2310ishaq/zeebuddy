import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { PushNotification, User } from '@/models';
import { requireAdmin } from '@/lib/auth';
import { sendBroadcastPush } from '@/lib/push-delivery';
import { isPostNotificationsEnabled } from '@/lib/app-settings';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * GET /api/v1/admin/push-notifications
 * Returns notification history. Query: limit (default 50, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const notifications = await PushNotification.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean();

    return apiSuccess(
      notifications.map((n) => ({
        id: n._id,
        title: n.title,
        body: n.body,
        status: n.status,
        sentAt: n.sentAt,
        createdAt: n.createdAt,
        createdBy: (n as unknown as { createdBy?: { name: string; email: string } }).createdBy,
      }))
    );
  } catch (err) {
    console.error('Push notifications list error:', err);
    return apiError('Failed to fetch notifications', 'SERVER_ERROR', 500);
  }
}

/**
 * POST /api/v1/admin/push-notifications
 * Send push to Android (FCM) and iOS (APNs) using stored tokens.
 * Body: { title: string, body: string, targetAudience?: 'all' | 'segment' }
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request.headers.get('Authorization'));
    if (!adminUser) return apiUnauthorized();

    await connectDB();

    const body = await request.json();
    const { title, body: notificationBody, targetAudience = 'all' } = body;

    if (!title || !notificationBody) {
      return apiError('title and body are required', 'VALIDATION_ERROR', 400);
    }

    const globalEnabled = await isPostNotificationsEnabled();
    if (!globalEnabled) {
      return apiError('Post notifications are disabled. Enable them in Dashboard settings.', 'NOTIFICATIONS_DISABLED', 400);
    }

    const users = await User.find({
      deletedAt: null,
      $or: [
        { fcmToken: { $exists: true, $ne: '' } },
        { pushTokens: { $elemMatch: { token: { $exists: true, $nin: [null, ''] } } } },
      ],
    })
      .select('fcmToken pushTokens notificationSettings')
      .lean();

    const notification = await PushNotification.create({
      title,
      body: notificationBody,
      targetAudience,
      createdBy: adminUser._id,
      status: 'pending',
    });

    const data = {
      type: 'admin_broadcast',
      notificationId: String(notification._id),
    };

    try {
      const result = await sendBroadcastPush(users, title, notificationBody, data);

      if (result.totalTargets === 0) {
        await PushNotification.findByIdAndUpdate(notification._id, {
          status: 'sent',
          sentAt: new Date(),
          updatedAt: new Date(),
        });
        return apiSuccess(
          {
            id: notification._id,
            title,
            body: notificationBody,
            status: 'sent',
            sentAt: new Date(),
            successCount: 0,
            failureCount: 0,
            totalTokens: 0,
            message:
              'No devices to send to. Users must register tokens via POST /api/v1/user/fcm-token (Android: FCM; iOS: APNs device token with platform).',
          },
          'No push tokens registered. Enable push in the user app and ensure users have signed in.',
          201
        );
      }

      await PushNotification.findByIdAndUpdate(notification._id, {
        status: 'sent',
        sentAt: new Date(),
        updatedAt: new Date(),
      });

      return apiSuccess(
        {
          id: notification._id,
          title,
          body: notificationBody,
          status: 'sent',
          sentAt: new Date(),
          successCount: result.successCount,
          failureCount: result.failureCount,
          totalTokens: result.totalTargets,
          deliveryLogs: result.deliveryLogs,
        },
        result.successCount === 0 && result.failureCount > 0
          ? 'Notification recorded but all deliveries failed. Tokens may be invalid, expired, or APNs/FCM misconfigured.'
          : 'Notification sent',
        201
      );
    } catch (sendErr) {
      console.error('Push send error:', sendErr);
      await PushNotification.findByIdAndUpdate(notification._id, {
        status: 'sent',
        sentAt: new Date(),
        updatedAt: new Date(),
      });
      return apiError(
        'Failed to send push. Check FIREBASE_* for FCM and APNS_* for iOS (.p8, Team ID, Key ID, Bundle ID).',
        'SERVER_ERROR',
        500
      );
    }
  } catch (err) {
    console.error('Push notification send error:', err);
    return apiError('Failed to send notification', 'SERVER_ERROR', 500);
  }
}
