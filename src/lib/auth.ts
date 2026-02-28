import { verifyIdToken } from './firebase-admin';
import { verifyAdminToken, verifyUserToken } from './jwt';
import { User } from '@/models';
import { connectDB } from './db';

export async function getAuthUser(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  try {
    const adminPayload = await verifyAdminToken(token);
    if (adminPayload) {
      await connectDB();
      const user = await User.findOne({ _id: adminPayload.userId, deletedAt: null }).lean();
      return user;
    }
  } catch {
    /* try user JWT then Firebase */
  }

  try {
    const userPayload = await verifyUserToken(token);
    if (userPayload) {
      await connectDB();
      const user = await User.findOne({ _id: userPayload.userId, deletedAt: null }).lean();
      return user ?? null;
    }
  } catch {
    /* try Firebase */
  }

  try {
    const decoded = await verifyIdToken(token);
    await connectDB();
    const user = await User.findOne({
      $or: [{ firebaseUid: decoded.uid }, { email: decoded.email }],
      deletedAt: null,
    }).lean();
    return user ?? null;
  } catch {
    return null;
  }
}

export async function requireAuth(authHeader: string | null) {
  const user = await getAuthUser(authHeader);
  if (!user) return null;
  return user;
}

export async function requireAdmin(authHeader: string | null) {
  const user = await requireAuth(authHeader);
  if (!user || user.role !== 'admin') return null;
  return user;
}

/** Requires authenticated user (role === 'user'). Use for user app APIs. */
export async function requireUser(authHeader: string | null) {
  const user = await requireAuth(authHeader);
  if (!user || user.role !== 'user') return null;
  return user;
}
