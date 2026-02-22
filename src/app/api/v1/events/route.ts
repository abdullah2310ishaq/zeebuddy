import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Event } from '@/models';
import { apiSuccess, apiError } from '@/lib/api-response';

/**
 * GET /api/v1/events
 * Upcoming events for user app, paginated
 * Query: limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const now = new Date();
    const query = { deletedAt: null, date: { $gte: now } };

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('createdBy', 'name')
        .sort({ date: 1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Event.countDocuments(query),
    ]);

    return apiSuccess({
      data: events,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error('Events list error:', err);
    return apiError('Failed to fetch events', 'SERVER_ERROR', 500);
  }
}
