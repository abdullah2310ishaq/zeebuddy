import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { AppSettings, POST_NOTIFICATIONS_KEY } from '@/models';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * GET /api/v1/admin/settings/post-notifications
 * Get post notifications toggle state (global: when OFF, no push to users)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers.get('Authorization'));
    if (!admin) return apiUnauthorized();

    await connectDB();

    const doc = await AppSettings.findOne({ key: POST_NOTIFICATIONS_KEY }).lean();
    const enabled = doc?.value !== false; // default true if not set

    return apiSuccess({ enabled });
  } catch (err) {
    console.error('Get post-notifications setting error:', err);
    return apiError('Failed to fetch setting', 'SERVER_ERROR', 500);
  }
}

/**
 * PATCH /api/v1/admin/settings/post-notifications
 * Enable or disable post notifications globally.
 * Body: { enabled: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers.get('Authorization'));
    if (!admin) return apiUnauthorized();

    const body = await request.json();
    const enabled = body?.enabled;

    if (typeof enabled !== 'boolean') {
      return apiError('enabled must be boolean', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    await AppSettings.findOneAndUpdate(
      { key: POST_NOTIFICATIONS_KEY },
      { $set: { value: enabled, updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    return apiSuccess({ enabled }, enabled ? 'Post notifications enabled' : 'Post notifications disabled', 200);
  } catch (err) {
    console.error('Update post-notifications setting error:', err);
    return apiError('Failed to update setting', 'SERVER_ERROR', 500);
  }
}
