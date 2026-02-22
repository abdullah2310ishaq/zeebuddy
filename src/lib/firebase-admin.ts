import * as admin from 'firebase-admin';

function getFirebaseAdmin() {
  if (admin.apps.length > 0) return admin.app();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase admin credentials missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const app = getFirebaseAdmin();
  return app.auth().verifyIdToken(idToken);
}

export async function sendFCMNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (tokens.length === 0) return { successCount: 0, failureCount: 0 };

  const app = getFirebaseAdmin();
  const message: admin.messaging.MulticastMessage = {
    notification: { title, body },
    data: data ?? {},
    tokens,
  };

  const response = await app.messaging().sendEachForMulticast(message);
  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    responses: response.responses,
  };
}

/** Send FCM to a single user by token. No-op if token missing. */
export async function sendFCMToUser(
  fcmToken: string | undefined | null,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (!fcmToken?.trim()) return { successCount: 0, failureCount: 0 };
  return sendFCMNotification([fcmToken.trim()], title, body, data);
}

export { admin };
