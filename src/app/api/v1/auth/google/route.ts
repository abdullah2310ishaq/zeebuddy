import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { verifyIdToken } from '@/lib/firebase-admin';
import { apiSuccess, apiError } from '@/lib/api-response';

/**
 * POST /api/v1/auth/google
 * Google sign-in (Firebase Auth → link to user)
 * Body: { idToken: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return apiError('idToken is required', 'MISSING_TOKEN', 400);
    }

    const decoded = await verifyIdToken(idToken);
    await connectDB();

    let user = await User.findOne({
      $or: [{ firebaseUid: decoded.uid }, { email: decoded.email }],
      deletedAt: null,
    });

    if (!user) {
      user = await User.create({
        email: decoded.email ?? decoded.uid,
        firebaseUid: decoded.uid,
        name: decoded.name ?? decoded.email ?? 'User',
        role: 'user',
        avatarUrl: decoded.picture ?? undefined,
      });
    } else {
      await User.findByIdAndUpdate(user._id, {
        firebaseUid: decoded.uid,
        avatarUrl: decoded.picture ?? user.avatarUrl,
        updatedAt: new Date(),
      });
    }

    const userObj = user.toObject ? user.toObject() : user;
    const { passwordHash, ...safeUser } = userObj as unknown as Record<string, unknown>;
    return apiSuccess({ user: safeUser, message: 'Signed in successfully' });
  } catch (err) {
    console.error('Google auth error:', err);
    return apiError('Invalid or expired token', 'UNAUTHORIZED', 401);
  }
}
