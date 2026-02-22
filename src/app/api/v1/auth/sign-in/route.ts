import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { verifyPassword } from '@/lib/auth-utils';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * POST /api/v1/auth/sign-in
 * Login with email + password
 * Body: { email: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiError('email and password are required', 'VALIDATION_ERROR', 400);
    }

    const emailTrimmed = String(email).trim().toLowerCase();
    await connectDB();

    const user = await User.findOne({ email: emailTrimmed, deletedAt: null });
    if (!user) {
      return apiUnauthorized('Invalid email or password');
    }

    if (!user.passwordHash) {
      return apiError('This account uses Google sign-in. Use Google to sign in.', 'USE_GOOGLE', 400);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return apiUnauthorized('Invalid email or password');
    }

    const userObj = user.toObject ? user.toObject() : user;
    const { passwordHash, ...safeUser } = userObj as unknown as Record<string, unknown>;
    return apiSuccess({ user: safeUser, message: 'Signed in successfully' });
  } catch (err) {
    console.error('Sign-in error:', err);
    return apiError('Sign-in failed', 'SERVER_ERROR', 500);
  }
}
