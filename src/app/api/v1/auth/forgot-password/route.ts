import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Otp } from '@/models';
import { generateOtp } from '@/lib/auth-utils';
import { sendOtpEmail } from '@/lib/email';
import { apiSuccess, apiError } from '@/lib/api-response';

const OTP_EXPIRY_MINUTES = 10;

/**
 * POST /api/v1/auth/forgot-password
 * Request OTP for password reset - sends email
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return apiError('email is required', 'VALIDATION_ERROR', 400);
    }

    const emailTrimmed = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return apiError('Invalid email format', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const user = await User.findOne({ email: emailTrimmed, deletedAt: null });
    if (!user) {
      return apiSuccess(
        { message: 'If this email exists, you will receive a reset code.' },
        'If this email exists, you will receive a reset code.'
      );
    }

    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.deleteMany({ email: emailTrimmed, purpose: 'reset' });
    await Otp.create({ email: emailTrimmed, otp, purpose: 'reset', expiresAt });

    await sendOtpEmail(emailTrimmed, otp, 'reset');

    return apiSuccess(
      { message: 'Reset code sent to your email. Check your inbox.' },
      'Reset code sent to your email.'
    );
  } catch (err) {
    console.error('Forgot password error:', err);
    return apiError('Failed to send reset code', 'SERVER_ERROR', 500);
  }
}
