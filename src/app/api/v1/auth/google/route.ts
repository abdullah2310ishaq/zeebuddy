import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { verifyIdToken } from '@/lib/firebase-admin';
import { createUserToken } from '@/lib/jwt';
import { apiSuccess, apiError } from '@/lib/api-response';

/**
 * POST /api/v1/auth/google
 * Google sign-in (Firebase Auth → link to user). Returns user + token.
 * Body: { idToken: string } — must be JSON, Content-Type: application/json.
 * 400 = missing or invalid body/idToken; 401 = token invalid or expired (wrong project, expired, or not a Firebase ID token).
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Request body must be valid JSON with idToken', 'INVALID_BODY', 400);
  }
  const idToken = typeof body === 'object' && body !== null && typeof (body as { idToken?: unknown }).idToken === 'string'
    ? (body as { idToken: string }).idToken.trim()
    : '';

  if (!idToken) {
    return apiError('idToken is required. Send JSON body: { "idToken": "<Firebase ID token>" }', 'MISSING_TOKEN', 400);
  }

  try {
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

    const token = await createUserToken(String(user._id));
    const userObj = user.toObject ? user.toObject() : (user as unknown as Record<string, unknown>);
    const { passwordHash, ...safeUser } = userObj as Record<string, unknown>;
    return apiSuccess({ user: safeUser, token, message: 'Signed in successfully' });
  } catch (err) {
    console.error('Google auth error:', err);
    return apiError(
      'Invalid or expired token. Ensure the user app uses the same Firebase project and sends the Firebase ID token from getIdToken().',
      'UNAUTHORIZED',
      401
    );
  }
}
