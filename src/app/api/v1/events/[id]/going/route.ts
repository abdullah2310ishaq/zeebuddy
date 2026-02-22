import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Event, EventBooking } from '@/models';
import { requireUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/lib/api-response';
import mongoose from 'mongoose';

/**
 * POST /api/v1/events/:id/going
 * Mark user as going or interested in an event.
 * Body: { status?: 'going' | 'interested' } (default: 'going')
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return apiError('Invalid event ID', 'VALIDATION_ERROR', 400);
    }

    const body = await request.json().catch(() => ({}));
    const status = body?.status === 'interested' ? 'interested' : 'going';

    await connectDB();

    const event = await Event.findOne({ _id: id, deletedAt: null });
    if (!event) return apiNotFound('Event not found');

    const existing = await EventBooking.findOne({ eventId: id, userId: user._id });
    if (existing) {
      await EventBooking.findByIdAndUpdate(existing._id, { status });
      return apiSuccess(
        { eventId: id, userId: user._id, status },
        'Interest updated',
        200
      );
    }

    await EventBooking.create({
      eventId: id,
      userId: user._id,
      status,
    });

    await Event.findByIdAndUpdate(id, {
      $inc: { attendeesCount: 1 },
      updatedAt: new Date(),
    });

    return apiSuccess(
      { eventId: id, userId: user._id, status },
      'Marked as going',
      201
    );
  } catch (err) {
    console.error('Event going POST error:', err);
    return apiError('Failed to mark event interest', 'SERVER_ERROR', 500);
  }
}

/**
 * DELETE /api/v1/events/:id/going
 * Remove user's going/interested status for an event.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return apiError('Invalid event ID', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const event = await Event.findOne({ _id: id, deletedAt: null });
    if (!event) return apiNotFound('Event not found');

    const booking = await EventBooking.findOneAndDelete({
      eventId: id,
      userId: user._id,
    });

    if (booking) {
      await Event.findByIdAndUpdate(id, {
        $inc: { attendeesCount: -1 },
        updatedAt: new Date(),
      });
    }

    return apiSuccess(
      { eventId: id, removed: !!booking },
      booking ? 'Removed from event' : 'Not registered for this event',
      200
    );
  } catch (err) {
    console.error('Event going DELETE error:', err);
    return apiError('Failed to remove event interest', 'SERVER_ERROR', 500);
  }
}
