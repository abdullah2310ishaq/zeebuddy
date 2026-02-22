import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiUnauthorized } from '@/lib/api-response';

/**
 * GET /api/v1/auth/admin/me
 * Returns current admin user from Bearer token (JWT or Firebase)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const user = await requireAdmin(authHeader);

  if (!user) {
    return apiUnauthorized('Invalid or expired token');
  }

  const u = user as unknown as Record<string, unknown>;
  const { passwordHash, firebaseUid, ...safeUser } = u;
  const authType = firebaseUid ? 'google' : 'email';
  return apiSuccess({ ...safeUser, authType });
}
