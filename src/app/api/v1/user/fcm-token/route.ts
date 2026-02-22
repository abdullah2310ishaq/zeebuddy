import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { requireUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * POST /api/v1/user/fcm-token
 * Register or update FCM device token for push notifications.
 * Body: { fcmToken: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    const body = await request.json();
    const fcmToken = typeof body?.fcmToken === 'string' ? body.fcmToken.trim() : null;

    if (!fcmToken) {
      return apiError('fcmToken is required', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    await User.findByIdAndUpdate(user._id, {
      fcmToken,
      updatedAt: new Date(),
    });

    return apiSuccess({ message: 'FCM token registered' }, 'FCM token updated', 200);
  } catch (err) {
    console.error('FCM token registration error:', err);
    return apiError('Failed to register FCM token', 'SERVER_ERROR', 500);
  }
}
