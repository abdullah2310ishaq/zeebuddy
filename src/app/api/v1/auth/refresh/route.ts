import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { requireUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * POST /api/v1/auth/refresh
 * Verify current token and return user. Use after Firebase getIdToken(true) to validate session.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    await connectDB();

    const fresh = await User.findOne({ _id: user._id, deletedAt: null })
      .select('-passwordHash -firebaseUid -__v')
      .lean();

    if (!fresh) return apiError('User not found', 'NOT_FOUND', 404);

    const { passwordHash, firebaseUid, __v, ...safe } = fresh as unknown as Record<string, unknown>;
    return apiSuccess(safe, 'Session valid');
  } catch (err) {
    console.error('Auth refresh error:', err);
    return apiError('Session invalid or expired', 'UNAUTHORIZED', 401);
  }
}
