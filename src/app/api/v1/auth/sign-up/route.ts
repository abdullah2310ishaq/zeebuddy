import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Otp } from '@/models';
import { generateOtp } from '@/lib/auth-utils';
import { sendOtpEmail } from '@/lib/email';
import { apiSuccess, apiError } from '@/lib/api-response';

const OTP_EXPIRY_MINUTES = 10;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/v1/auth/sign-up
 * Step 1: Submit email, firstName, lastName, password.
 * If email already exists → EMAIL_EXISTS.
 * Otherwise send OTP to email (purpose: verification). Account is created after confirm-sign-up.
 * Body: { email: string, firstName: string, lastName: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, password } = body as Record<string, unknown>;

    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const firstNameStr = typeof firstName === 'string' ? firstName.trim() : '';
    const lastNameStr = typeof lastName === 'string' ? lastName.trim() : '';
    const passwordStr = typeof password === 'string' ? password : '';

    if (!emailStr) {
      return apiError('email is required', 'VALIDATION_ERROR', 400);
    }
    if (!emailRegex.test(emailStr)) {
      return apiError('Invalid email format', 'VALIDATION_ERROR', 400);
    }
    if (!firstNameStr) {
      return apiError('firstName is required', 'VALIDATION_ERROR', 400);
    }
    if (!lastNameStr) {
      return apiError('lastName is required', 'VALIDATION_ERROR', 400);
    }
    if (!passwordStr || passwordStr.length < 6) {
      return apiError('Password must be at least 6 characters', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const existing = await User.findOne({ email: emailStr, deletedAt: null });
    if (existing) {
      return apiError('Email already registered. Sign in instead.', 'EMAIL_EXISTS', 400);
    }

    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.deleteMany({ email: emailStr, purpose: 'verification' });
    await Otp.create({ email: emailStr, otp, purpose: 'verification', expiresAt });

    try {
      await sendOtpEmail(emailStr, otp, 'verification');
    } catch (emailErr) {
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        console.log('[Sign-up DEV] OTP email failed (e.g. SMTP not configured). Use this OTP for', emailStr, ':', otp);
        return apiSuccess(
          { message: 'Verification code sent. In development, check server console for OTP.', devOtp: otp },
          'Verification code sent (see server console in dev).',
          200
        );
      }
      console.error('Sign-up email error:', emailErr);
      return apiError('Could not send verification email. Try again later.', 'EMAIL_SEND_FAILED', 500);
    }

    return apiSuccess(
      { message: 'Verification code sent to your email. Check your inbox and confirm to complete sign-up.' },
      'Verification code sent to your email.',
      200
    );
  } catch (err) {
    console.error('Sign-up error:', err);
    return apiError('Registration request failed', 'SERVER_ERROR', 500);
  }
}
