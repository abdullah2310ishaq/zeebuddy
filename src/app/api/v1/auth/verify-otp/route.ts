import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Otp } from '@/models';
import { apiSuccess, apiError } from '@/lib/api-response';

/**
 * POST /api/v1/auth/verify-otp
 * Verify OTP (for reset password or sign-in)
 * Body: { email: string, otp: string, purpose?: 'reset' | 'verification' | 'signin' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, purpose = 'reset' } = body;

    if (!email || !otp) {
      return apiError('email and otp are required', 'VALIDATION_ERROR', 400);
    }

    const emailTrimmed = String(email).trim().toLowerCase();
    const otpTrimmed = String(otp).trim();

    await connectDB();

    const otpRecord = await Otp.findOne({
      email: emailTrimmed,
      otp: otpTrimmed,
      purpose,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return apiError('Invalid or expired code', 'INVALID_OTP', 400);
    }

    await Otp.findByIdAndDelete(otpRecord._id);

    return apiSuccess(
      { verified: true, message: 'Code verified successfully' },
      'Code verified successfully'
    );
  } catch (err) {
    console.error('Verify OTP error:', err);
    return apiError('Verification failed', 'SERVER_ERROR', 500);
  }
}
