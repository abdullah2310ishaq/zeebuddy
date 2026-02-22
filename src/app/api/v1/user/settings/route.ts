import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { requireUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

type NotificationSettingKey = 'postApprovalRejection' | 'adminPush' | 'eventReminders';

const VALID_KEYS: NotificationSettingKey[] = ['postApprovalRejection', 'adminPush', 'eventReminders'];

/**
 * GET /api/v1/user/settings
 * Get user notification settings
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    await connectDB();

    const dbUser = await User.findOne({ _id: user._id, deletedAt: null })
      .select('notificationSettings')
      .lean();

    if (!dbUser) return apiError('User not found', 'NOT_FOUND', 404);

    const settings = dbUser.notificationSettings ?? {
      postApprovalRejection: true,
      adminPush: true,
      eventReminders: true,
    };

    return apiSuccess({ notificationSettings: settings });
  } catch (err) {
    console.error('Get settings error:', err);
    return apiError('Failed to fetch settings', 'SERVER_ERROR', 500);
  }
}

/**
 * PATCH /api/v1/user/settings
 * Update notification settings.
 * Body: { notificationSettings?: { postApprovalRejection?: boolean, adminPush?: boolean, eventReminders?: boolean } }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    const body = await request.json();
    const notificationSettings = body?.notificationSettings;

    if (!notificationSettings || typeof notificationSettings !== 'object') {
      return apiError('notificationSettings object is required', 'VALIDATION_ERROR', 400);
    }

    const updates: Record<string, boolean> = {};
    for (const key of VALID_KEYS) {
      if (notificationSettings[key] !== undefined) {
        if (typeof notificationSettings[key] !== 'boolean') {
          return apiError(`notificationSettings.${key} must be boolean`, 'VALIDATION_ERROR', 400);
        }
        updates[`notificationSettings.${key}`] = notificationSettings[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return apiSuccess({ message: 'No updates' }, 'No changes applied', 200);
    }

    await connectDB();

    const updated = await User.findByIdAndUpdate(
      user._id,
      { $set: updates, updatedAt: new Date() },
      { new: true }
    )
      .select('notificationSettings')
      .lean();

    if (!updated) return apiError('User not found', 'NOT_FOUND', 404);

    return apiSuccess(
      { notificationSettings: updated.notificationSettings ?? {} },
      'Settings updated',
      200
    );
  } catch (err) {
    console.error('Update settings error:', err);
    return apiError('Failed to update settings', 'SERVER_ERROR', 500);
  }
}
