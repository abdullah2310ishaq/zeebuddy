import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { requireUser } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/auth-utils';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * PATCH /api/v1/user/change-password
 * Change password for email/password users.
 * Body: { currentPassword: string, newPassword: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return apiError('currentPassword and newPassword are required', 'VALIDATION_ERROR', 400);
    }

    const newPassStr = String(newPassword).trim();
    if (newPassStr.length < 6) {
      return apiError('newPassword must be at least 6 characters', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const dbUser = await User.findOne({ _id: user._id, deletedAt: null });
    if (!dbUser) return apiError('User not found', 'NOT_FOUND', 404);

    if (!dbUser.passwordHash) {
      return apiError('This account uses Google sign-in. Password cannot be changed.', 'USE_GOOGLE', 400);
    }

    const valid = await verifyPassword(String(currentPassword), dbUser.passwordHash);
    if (!valid) {
      return apiError('Current password is incorrect', 'INVALID_PASSWORD', 400);
    }

    const passwordHash = await hashPassword(newPassStr);
    await User.findByIdAndUpdate(dbUser._id, { passwordHash, updatedAt: new Date() });

    return apiSuccess({ message: 'Password changed' }, 'Password updated successfully', 200);
  } catch (err) {
    console.error('Change password error:', err);
    return apiError('Failed to change password', 'SERVER_ERROR', 500);
  }
}
