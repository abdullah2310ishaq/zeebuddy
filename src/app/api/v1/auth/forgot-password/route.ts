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
      return apiError('Email not registered.', 'EMAIL_NOT_FOUND', 404);
    }

    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.deleteMany({ email: emailTrimmed, purpose: 'reset' });
    await Otp.create({ email: emailTrimmed, otp, purpose: 'reset', expiresAt });

    try {
      await sendOtpEmail(emailTrimmed, otp, 'reset');
    } catch (emailErr) {
      const errMsg = emailErr instanceof Error ? emailErr.message : String(emailErr);
      const errCode = emailErr && typeof emailErr === 'object' && 'code' in emailErr ? (emailErr as { code: string }).code : '';
      console.error('[Forgot-password] Email send failed:', errCode || errMsg);
      if (emailErr && typeof emailErr === 'object' && 'response' in emailErr) {
        console.error('[Forgot-password] SMTP response:', (emailErr as { response: string }).response);
      }
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        console.log('[Forgot-password DEV] Use this OTP for', emailTrimmed, ':', otp);
        return apiSuccess(
          { message: 'Reset code sent. In development, check server console for OTP.', devOtp: otp },
          'Reset code sent (see server console in dev).'
        );
      }
      return apiError('Could not send reset code. Try again later.', 'EMAIL_SEND_FAILED', 500);
    }

    return apiSuccess(
      { message: 'Reset code sent to your email. Check your inbox.' },
      'Reset code sent to your email.'
    );
  } catch (err) {
    console.error('Forgot password error:', err);
    return apiError('Failed to send reset code', 'SERVER_ERROR', 500);
  }
}
