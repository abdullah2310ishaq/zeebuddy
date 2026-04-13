import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import type { IUserPushToken } from '@/models/User';
import { requireUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * POST /api/v1/user/fcm-token
 * Register or update a device token for push.
 *
 * Android (FCM): `{ "fcmToken": "...", "platform": "android" }` (platform optional; defaults to android)
 * iOS (APNs): `{ "token": "...", "platform": "ios", "environment": "production" | "development" }`
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    const body = await request.json();
    const platformRaw = body?.platform;
    const platform: 'ios' | 'android' =
      platformRaw === 'ios' || platformRaw === 'android' ? platformRaw : 'android';

    const token =
      typeof body?.token === 'string'
        ? body.token.trim()
        : typeof body?.fcmToken === 'string'
          ? body.fcmToken.trim()
          : null;

    if (!token) {
      return apiError('token or fcmToken is required', 'VALIDATION_ERROR', 400);
    }

    const environment =
      body?.environment === 'development' || body?.environment === 'production'
        ? body.environment
        : undefined;

    await connectDB();

    const existing = await User.findById(user._id).select('pushTokens').lean();
    if (!existing) {
      return apiError('User not found', 'NOT_FOUND', 404);
    }

    const prev = (existing.pushTokens ?? []) as IUserPushToken[];
    const next: IUserPushToken[] = prev.filter((p) => p.platform !== platform);
    const entry: IUserPushToken = { platform, token };
    if (platform === 'ios' && environment) {
      entry.environment = environment;
    }
    next.push(entry);

    const update: Record<string, unknown> = {
      pushTokens: next,
      updatedAt: new Date(),
    };
    if (platform === 'android') {
      update.fcmToken = token;
    }

    await User.findByIdAndUpdate(user._id, update);

    return apiSuccess(
      { message: 'Push token registered', platform },
      platform === 'ios' ? 'APNs device token updated' : 'FCM token updated',
      200
    );
  } catch (err) {
    console.error('Push token registration error:', err);
    return apiError('Failed to register push token', 'SERVER_ERROR', 500);
  }
}
