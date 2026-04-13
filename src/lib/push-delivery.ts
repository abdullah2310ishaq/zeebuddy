import { sendFCMNotification } from '@/lib/firebase-admin';
import { sendApnsNotification } from '@/lib/send-apns';
import type { INotificationSettings, IUserPushToken } from '@/models/User';

export type PushDeliveryLog = {
  index: number;
  channel: 'fcm' | 'apns';
  success: boolean;
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
};

type LeanUserForPush = {
  fcmToken?: string;
  pushTokens?: IUserPushToken[];
  notificationSettings?: INotificationSettings;
};

function iosUsesProduction(env?: 'development' | 'production'): boolean {
  if (env === 'development') return false;
  return true;
}

/** Prefer explicit android row in pushTokens; fall back to legacy fcmToken. */
export function getAndroidFcmToken(user: LeanUserForPush): string | undefined {
  const fromArray = user.pushTokens?.find((p) => p.platform === 'android' && p.token?.trim());
  if (fromArray?.token) return fromArray.token.trim();
  const legacy = user.fcmToken?.trim();
  return legacy || undefined;
}

export function getIosTokenEntries(user: LeanUserForPush): Array<{ token: string; production: boolean }> {
  const out: Array<{ token: string; production: boolean }> = [];
  for (const p of user.pushTokens ?? []) {
    if (p.platform !== 'ios' || !p.token?.trim()) continue;
    out.push({
      token: p.token.trim(),
      production: iosUsesProduction(p.environment),
    });
  }
  return out;
}

export function hasAnyRegisteredPushToken(user: LeanUserForPush | null | undefined): boolean {
  if (!user) return false;
  if (user.fcmToken?.trim()) return true;
  return (user.pushTokens ?? []).some((p) => p.token?.trim());
}

/**
 * Sends to the author’s Android (FCM) and iOS (APNs) registrations.
 * `data` values must already be strings (FCM + APNs custom payload).
 */
export async function sendPushToUser(
  user: LeanUserForPush,
  title: string,
  body: string,
  data: Record<string, string>
): Promise<{ successCount: number; failureCount: number }> {
  let successCount = 0;
  let failureCount = 0;

  const android = getAndroidFcmToken(user);
  if (android) {
    const r = await sendFCMNotification([android], title, body, data);
    successCount += r.successCount;
    failureCount += r.failureCount;
  }

  for (const ios of getIosTokenEntries(user)) {
    const r = await sendApnsNotification([ios.token], title, body, data, ios.production);
    successCount += r.successCount;
    failureCount += r.failureCount;
  }

  return { successCount, failureCount };
}

export interface BroadcastSendResult {
  successCount: number;
  failureCount: number;
  totalTargets: number;
  deliveryLogs: PushDeliveryLog[];
}

/**
 * Broadcast the same title/body/data to many users (admin push).
 * Batches FCM and APNs (per environment) for efficiency.
 */
export async function sendBroadcastPush(
  users: LeanUserForPush[],
  title: string,
  body: string,
  data: Record<string, string>
): Promise<BroadcastSendResult> {
  const androidSet = new Set<string>();
  const iosProd = new Set<string>();
  const iosSandbox = new Set<string>();

  for (const u of users) {
    const settings = u.notificationSettings;
    if (settings?.adminPush === false) continue;

    const android = getAndroidFcmToken(u);
    if (android) androidSet.add(android);

    for (const ios of getIosTokenEntries(u)) {
      if (ios.production) iosProd.add(ios.token);
      else iosSandbox.add(ios.token);
    }
  }

  const androidTokens = [...androidSet];
  const deliveryLogs: PushDeliveryLog[] = [];
  let logIndex = 0;
  let successCount = 0;
  let failureCount = 0;

  if (androidTokens.length > 0) {
    const result = await sendFCMNotification(androidTokens, title, body, data);
    successCount += result.successCount;
    failureCount += result.failureCount;
    if (result.responses?.length) {
      result.responses.forEach((r) => {
        logIndex += 1;
        if (r.success) {
          deliveryLogs.push({
            index: logIndex,
            channel: 'fcm',
            success: true,
            messageId: (r as { messageId?: string }).messageId,
          });
        } else if (r.error) {
          const err = r.error as { code?: string; message?: string };
          deliveryLogs.push({
            index: logIndex,
            channel: 'fcm',
            success: false,
            errorCode: err.code ?? 'unknown',
            errorMessage: err.message ?? 'No message',
          });
        } else {
          deliveryLogs.push({
            index: logIndex,
            channel: 'fcm',
            success: false,
            errorCode: 'unknown',
            errorMessage: 'No error details',
          });
        }
      });
    }
  }

  const sendIosBatch = async (tokens: string[], production: boolean) => {
    if (tokens.length === 0) return;
    const r = await sendApnsNotification(tokens, title, body, data, production);
    successCount += r.successCount;
    failureCount += r.failureCount;
    for (let i = 0; i < r.successCount; i += 1) {
      logIndex += 1;
      deliveryLogs.push({ index: logIndex, channel: 'apns', success: true });
    }
    for (const f of r.failures) {
      logIndex += 1;
      deliveryLogs.push({
        index: logIndex,
        channel: 'apns',
        success: false,
        errorCode: 'APNS_ERROR',
        errorMessage: f.reason,
      });
    }
  };

  await sendIosBatch([...iosProd], true);
  await sendIosBatch([...iosSandbox], false);

  const totalTargets = androidTokens.length + iosProd.size + iosSandbox.size;

  return { successCount, failureCount, totalTargets, deliveryLogs };
}
