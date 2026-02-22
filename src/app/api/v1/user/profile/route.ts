import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { requireUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

const ALLOWED_PROFILE_FIELDS = ['name', 'phone', 'avatarUrl'] as const;

/**
 * GET /api/v1/user/profile
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    await connectDB();

    const profile = await User.findOne({ _id: user._id, deletedAt: null })
      .select('-passwordHash -firebaseUid -__v')
      .lean();

    if (!profile) return apiError('Profile not found', 'NOT_FOUND', 404);

    const { passwordHash, firebaseUid, __v, ...safe } = profile as unknown as Record<string, unknown>;
    return apiSuccess(safe);
  } catch (err) {
    console.error('Get profile error:', err);
    return apiError('Failed to fetch profile', 'SERVER_ERROR', 500);
  }
}

/**
 * PATCH /api/v1/user/profile
 * Update profile. Body: { name?: string, phone?: string, avatarUrl?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return apiError('Invalid request body', 'VALIDATION_ERROR', 400);
    }

    const updates: Record<string, unknown> = {};
    for (const field of ALLOWED_PROFILE_FIELDS) {
      if (body[field] !== undefined) {
        if (field === 'name' && typeof body[field] === 'string') {
          const trimmed = body[field].trim();
          if (!trimmed) return apiError('name cannot be empty', 'VALIDATION_ERROR', 400);
          updates[field] = trimmed;
        } else if (field === 'phone') {
          updates[field] = body[field] === null || body[field] === '' ? undefined : String(body[field]);
        } else if (field === 'avatarUrl') {
          updates[field] = body[field] === null || body[field] === '' ? undefined : String(body[field]);
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return apiSuccess({ message: 'No updates' }, 'No changes applied', 200);
    }

    await connectDB();

    const updated = await User.findByIdAndUpdate(
      user._id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )
      .select('-passwordHash -firebaseUid -__v')
      .lean();

    if (!updated) return apiError('Profile not found', 'NOT_FOUND', 404);

    const { passwordHash, firebaseUid, __v, ...safe } = updated as unknown as Record<string, unknown>;
    return apiSuccess(safe, 'Profile updated', 200);
  } catch (err) {
    console.error('Update profile error:', err);
    return apiError('Failed to update profile', 'SERVER_ERROR', 500);
  }
}
