import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Post } from '@/models';

/**
 * GET /api/v1/cron/publish-scheduled
 * Cron job: publishes posts where status=scheduled and scheduledAt <= now.
 * Call this periodically (e.g. every minute via Vercel Cron).
 * Secured by CRON_SECRET in Authorization header.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  // When CRON_SECRET is set (production), require Bearer token. When unset (dev), allow for manual testing.
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await connectDB();
    const now = new Date();

    const result = await Post.updateMany(
      {
        status: 'scheduled',
        scheduledAt: { $lte: now },
        deletedAt: null,
      },
      { $set: { status: 'published', updatedAt: now } }
    );

    const count = result.modifiedCount;
    if (count > 0) {
      console.log(`[Cron] Published ${count} scheduled post(s)`);
    }

    return Response.json({
      success: true,
      published: count,
      message: count > 0 ? `Published ${count} post(s)` : 'No posts due',
    });
  } catch (err) {
    console.error('[Cron] publish-scheduled error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to publish scheduled posts' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
