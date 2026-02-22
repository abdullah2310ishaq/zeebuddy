import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { verifyIdToken } from '@/lib/firebase-admin';
import { createAdminToken } from '@/lib/jwt';
import { verifyPassword } from '@/lib/auth-utils';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * POST /api/v1/auth/admin/sign-in
 * Admin sign-in via email/password OR Firebase idToken
 * Body: { email?: string, password?: string } OR { idToken?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, email, password } = body;

    await connectDB();

    if (email && password) {
      const emailTrimmed = String(email).trim().toLowerCase();
      const user = await User.findOne({ email: emailTrimmed, deletedAt: null });

      if (!user) {
        return apiUnauthorized('Invalid email or password');
      }

      if (user.role !== 'admin') {
        return apiError('Access denied. Admin role required.', 'FORBIDDEN', 403);
      }

      if (!user.passwordHash) {
        return apiError('This account uses Google sign-in.', 'USE_GOOGLE', 400);
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return apiUnauthorized('Invalid email or password');
      }

      const token = await createAdminToken(String(user._id));
      const userObj = user.toObject ? user.toObject() : user;
      const { passwordHash, ...safeUser } = userObj as unknown as Record<string, unknown>;
      return apiSuccess(
        { user: safeUser, token, message: 'Signed in successfully' },
        'Signed in successfully',
        200
      );
    }

    if (!idToken) {
      return apiError('email and password, or idToken is required', 'MISSING_CREDENTIALS', 400);
    }

    const decoded = await verifyIdToken(idToken);
    const user = await User.findOne({
      $or: [{ firebaseUid: decoded.uid }, { email: decoded.email }],
      deletedAt: null,
    });

    if (!user) {
      return apiError('No admin account found. Please register first.', 'USER_NOT_FOUND', 404);
    }

    if (user.role !== 'admin') {
      return apiError('Access denied. Admin role required.', 'FORBIDDEN', 403);
    }

    const token = await createAdminToken(String(user._id));
    const userObj = user.toObject ? user.toObject() : user;
    const { passwordHash, ...safeUser } = userObj as unknown as Record<string, unknown>;
    return apiSuccess(
      { user: safeUser, token, message: 'Signed in successfully' },
      'Signed in successfully',
      200
    );
  } catch (err) {
    console.error('Admin sign-in error:', err);
    return apiUnauthorized('Invalid or expired token');
  }
}
