import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { PushNotification, User } from '@/models';
import { requireAdmin } from '@/lib/auth';
import { sendFCMNotification } from '@/lib/firebase-admin';
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
 * Send push notification via FCM
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
      fcmToken: { $exists: true, $ne: '' },
      deletedAt: null,
    })
      .select('fcmToken notificationSettings')
      .lean();
    const tokens = users
      .filter((u) => {
        const settings = u.notificationSettings;
        return settings?.adminPush !== false;
      })
      .map((u) => u.fcmToken)
      .filter((t): t is string => Boolean(t && String(t).trim()));

    const notification = await PushNotification.create({
      title,
      body: notificationBody,
      targetAudience,
      createdBy: adminUser._id,
      status: 'pending',
    });

    let successCount = 0;
    let failureCount = 0;

    if (tokens.length === 0) {
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
          message: 'No devices to send to. Users must register FCM tokens via the user app (POST /api/v1/user/fcm-token).',
        },
        'No FCM tokens registered. Enable push in the user app and ensure users have signed in.',
        201
      );
    }

    const deliveryLogs: { index: number; success: boolean; messageId?: string; errorCode?: string; errorMessage?: string }[] = [];

    try {
      const result = await sendFCMNotification(tokens, title, notificationBody, {
        notificationId: String(notification._id),
      });
      successCount = result.successCount;
      failureCount = result.failureCount;
      if (result.responses?.length) {
        result.responses.forEach((r, i) => {
          if (r.success) {
            deliveryLogs.push({ index: i + 1, success: true, messageId: (r as { messageId?: string }).messageId });
          } else if (r.error) {
            const err = r.error as { code?: string; message?: string };
            deliveryLogs.push({
              index: i + 1,
              success: false,
              errorCode: err.code ?? 'unknown',
              errorMessage: err.message ?? 'No message',
            });
            console.error(`[Push] FCM token[${i}] failed:`, err.code, err.message);
          } else {
            deliveryLogs.push({ index: i + 1, success: false, errorCode: 'unknown', errorMessage: 'No error details' });
          }
        });
      }
    } catch (fcmErr) {
      console.error('FCM send error:', fcmErr);
      await PushNotification.findByIdAndUpdate(notification._id, {
        status: 'sent',
        sentAt: new Date(),
        updatedAt: new Date(),
      });
      return apiError(
        'Failed to send via FCM. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY and that the user app has valid FCM tokens.',
        'SERVER_ERROR',
        500
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
        successCount,
        failureCount,
        totalTokens: tokens.length,
        /** Detailed per-token delivery logs for debugging (token index, success/fail, FCM error code/message). */
        deliveryLogs,
      },
      successCount === 0 && failureCount > 0
        ? 'Notification recorded but all deliveries failed. Tokens may be invalid or expired.'
        : 'Notification sent',
      201
    );
  } catch (err) {
    console.error('Push notification send error:', err);
    return apiError('Failed to send notification', 'SERVER_ERROR', 500);
  }
}
