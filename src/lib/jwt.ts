import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'zeebuddy-admin-secret-change-in-production';
const ALG = 'HS256';

export async function createAdminToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return new jose.SignJWT({ sub: userId, role: 'admin' })
    .setProtectedHeader({ alg: ALG })
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyAdminToken(token: string): Promise<{ userId: string } | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    const sub = payload.sub;
    if (!sub || payload.role !== 'admin') return null;
    return { userId: sub };
  } catch {
    return null;
  }
}

export async function createUserToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return new jose.SignJWT({ sub: userId, role: 'user' })
    .setProtectedHeader({ alg: ALG })
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyUserToken(token: string): Promise<{ userId: string } | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    const sub = payload.sub;
    if (!sub || payload.role !== 'user') return null;
    return { userId: sub };
  } catch {
    return null;
  }
}
