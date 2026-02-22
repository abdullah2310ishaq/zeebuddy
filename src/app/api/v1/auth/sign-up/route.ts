import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { hashPassword } from '@/lib/auth-utils';
import { apiSuccess, apiError } from '@/lib/api-response';

/**
 * POST /api/v1/auth/sign-up
 * Register with email + password
 * Body: { email: string, password: string, name: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return apiError('email, password, and name are required', 'VALIDATION_ERROR', 400);
    }

    const emailTrimmed = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return apiError('Invalid email format', 'VALIDATION_ERROR', 400);
    }

    if (password.length < 6) {
      return apiError('Password must be at least 6 characters', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const existing = await User.findOne({ email: emailTrimmed, deletedAt: null });
    if (existing) {
      return apiError('Email already registered. Sign in instead.', 'EMAIL_EXISTS', 400);
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email: emailTrimmed,
      passwordHash,
      name: String(name).trim(),
      role: 'user',
    });

    const userObj = user.toObject ? user.toObject() : user;
    const { passwordHash: _, ...safeUser } = userObj as unknown as Record<string, unknown>;
    return apiSuccess(
      { user: safeUser, message: 'Registered successfully' },
      'Registered successfully',
      201
    );
  } catch (err) {
    console.error('Sign-up error:', err);
    return apiError('Registration failed', 'SERVER_ERROR', 500);
  }
}
