import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Otp } from '@/models';
import { hashPassword } from '@/lib/auth-utils';
import { apiSuccess, apiError } from '@/lib/api-response';

/**
 * POST /api/v1/auth/reset-password
 * Reset password after OTP verification
 * Body: { email: string, otp: string, newPassword: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return apiError('email, otp, and newPassword are required', 'VALIDATION_ERROR', 400);
    }

    const emailTrimmed = String(email).trim().toLowerCase();
    const otpTrimmed = String(otp).trim();

    if (newPassword.length < 6) {
      return apiError('Password must be at least 6 characters', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const otpRecord = await Otp.findOne({
      email: emailTrimmed,
      otp: otpTrimmed,
      purpose: 'reset',
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return apiError('Invalid or expired code. Request a new one.', 'INVALID_OTP', 400);
    }

    const user = await User.findOne({ email: emailTrimmed, deletedAt: null });
    if (!user) {
      return apiError('User not found', 'NOT_FOUND', 404);
    }

    const passwordHash = await hashPassword(newPassword);
    await User.findByIdAndUpdate(user._id, { passwordHash, updatedAt: new Date() });
    await Otp.findByIdAndDelete(otpRecord._id);

    return apiSuccess(
      { message: 'Password reset successfully. You can now sign in.' },
      'Password reset successfully'
    );
  } catch (err) {
    console.error('Reset password error:', err);
    return apiError('Password reset failed', 'SERVER_ERROR', 500);
  }
}
