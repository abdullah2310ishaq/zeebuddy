import apn from 'apn';
import { getApnsProvider, getApnsTopic, isApnsConfigured } from '@/lib/apns';

export interface ApnsSendResult {
  successCount: number;
  failureCount: number;
  /** Per-device failures (APNs reason / error message). */
  failures: Array<{ device: string; reason: string }>;
}

/**
 * Sends an alert push to one or more APNs device tokens (hex).
 * Custom fields are nested under `data` to match the mobile app contract.
 */
export async function sendApnsNotification(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>,
  production: boolean
): Promise<ApnsSendResult> {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, failures: [] };
  }

  if (!isApnsConfigured()) {
    console.warn('[APNs] Skipping send: APNS_* env vars not configured.');
    return {
      successCount: 0,
      failureCount: tokens.length,
      failures: tokens.map((device) => ({ device, reason: 'APNs not configured on server' })),
    };
  }

  const provider = getApnsProvider(production);
  const note = new apn.Notification();
  note.topic = getApnsTopic();
  note.alert = { title, body };
  note.sound = 'default';
  note.payload = {
    data: { ...data },
  };

  let res: Awaited<ReturnType<apn.Provider['send']>>;
  try {
    res = await provider.send(note, tokens);
  } catch (err) {
    console.error('[APNs] provider.send failed:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      successCount: 0,
      failureCount: tokens.length,
      failures: tokens.map((device) => ({ device, reason: msg })),
    };
  }

  const failures: Array<{ device: string; reason: string }> = [];
  for (const f of res.failed) {
    const reason =
      f.response?.reason ??
      f.error?.message ??
      (typeof f.status === 'string' ? f.status : 'unknown');
    failures.push({ device: f.device, reason });
  }

  return {
    successCount: res.sent.length,
    failureCount: res.failed.length,
    failures,
  };
}
