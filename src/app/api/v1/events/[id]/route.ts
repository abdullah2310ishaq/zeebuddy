import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Event } from '@/models';
import { apiSuccess, apiError } from '@/lib/api-response';
import { Types } from 'mongoose';

/**
 * GET /api/v1/events/:id
 * Single event detail for user app
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return apiError('Invalid event ID', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const event = await Event.findOne({ _id: id, deletedAt: null })
      .populate('createdBy', 'name')
      .lean();

    if (!event) {
      return apiError('Event not found', 'NOT_FOUND', 404);
    }

    return apiSuccess(event);
  } catch (err) {
    console.error('Get event error:', err);
    return apiError('Failed to fetch event', 'SERVER_ERROR', 500);
  }
}
