import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Otp } from '@/models';
import { hashPassword } from '@/lib/auth-utils';
import { createUserToken } from '@/lib/jwt';
import { apiSuccess, apiError } from '@/lib/api-response';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/v1/auth/confirm-sign-up
 * Step 2: After OTP sent by sign-up, verify OTP and create user. Returns user + token.
 * Body: { email: string, otp: string, password: string, firstName: string, lastName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, password, firstName, lastName } = body as Record<string, unknown>;

    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const otpStr = typeof otp === 'string' ? otp.trim() : '';
    const passwordStr = typeof password === 'string' ? password : '';
    const firstNameStr = typeof firstName === 'string' ? firstName.trim() : '';
    const lastNameStr = typeof lastName === 'string' ? lastName.trim() : '';

    if (!emailStr) {
      return apiError('email is required', 'VALIDATION_ERROR', 400);
    }
    if (!emailRegex.test(emailStr)) {
      return apiError('Invalid email format', 'VALIDATION_ERROR', 400);
    }
    if (!otpStr) {
      return apiError('otp is required', 'VALIDATION_ERROR', 400);
    }
    if (!passwordStr || passwordStr.length < 6) {
      return apiError('Password must be at least 6 characters', 'VALIDATION_ERROR', 400);
    }
    if (!firstNameStr) {
      return apiError('firstName is required', 'VALIDATION_ERROR', 400);
    }
    if (!lastNameStr) {
      return apiError('lastName is required', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const existingUser = await User.findOne({ email: emailStr, deletedAt: null });
    if (existingUser) {
      return apiError('Email already registered. Sign in instead.', 'EMAIL_EXISTS', 400);
    }

    const otpRecord = await Otp.findOne({
      email: emailStr,
      otp: otpStr,
      purpose: 'verification',
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return apiError('Invalid or expired verification code. Request a new one.', 'INVALID_OTP', 400);
    }

    await Otp.findByIdAndDelete(otpRecord._id);

    const name = [firstNameStr, lastNameStr].filter(Boolean).join(' ') || emailStr;
    const passwordHash = await hashPassword(passwordStr);

    const user = await User.create({
      email: emailStr,
      passwordHash,
      name,
      firstName: firstNameStr,
      lastName: lastNameStr,
      role: 'user',
    });

    const token = await createUserToken(String(user._id));
    const userObj = user.toObject ? user.toObject() : (user as unknown as Record<string, unknown>);
    const { passwordHash: _, ...safeUser } = userObj as Record<string, unknown>;

    return apiSuccess(
      { user: safeUser, token, message: 'Account created. Your email is verified and password is set.' },
      'Account created successfully.',
      201
    );
  } catch (err) {
    console.error('Confirm sign-up error:', err);
    return apiError('Account creation failed', 'SERVER_ERROR', 500);
  }
}
