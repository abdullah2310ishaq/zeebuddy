import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { verifyPassword } from '@/lib/auth-utils';
import { createUserToken } from '@/lib/jwt';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * POST /api/v1/auth/sign-in
 * Login with email + password. Returns user + token.
 * Body: { email: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password) {
      return apiError('email and password are required', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const user = await User.findOne({ email, deletedAt: null });
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

    const token = await createUserToken(String(user._id));
    const userObj = user.toObject ? user.toObject() : (user as unknown as Record<string, unknown>);
    const { passwordHash, ...safeUser } = userObj as Record<string, unknown>;
    return apiSuccess({ user: safeUser, token, message: 'Signed in successfully' });
  } catch (err) {
    console.error('Sign-in error:', err);
    return apiError('Sign-in failed', 'SERVER_ERROR', 500);
  }
}
