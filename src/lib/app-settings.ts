import { connectDB } from './db';
import { AppSettings, POST_NOTIFICATIONS_KEY } from '@/models';

/**
 * Check if post notifications are globally enabled.
 * When false, approve/decline and admin custom push should NOT send to users.
 */
export async function isPostNotificationsEnabled(): Promise<boolean> {
  await connectDB();
  const doc = await AppSettings.findOne({ key: POST_NOTIFICATIONS_KEY }).lean();
  return doc?.value !== false;
}
