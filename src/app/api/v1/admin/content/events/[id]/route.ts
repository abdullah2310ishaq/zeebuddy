import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Event } from '@/models';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { Types } from 'mongoose';

/**
 * GET /api/v1/admin/content/events/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('Authorization');
  const admin = await requireAdmin(authHeader);
  if (!admin) {
    return apiUnauthorized('Authentication required');
  }

  try {
    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return apiError('Invalid event ID', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const event = await Event.findOne({ _id: id, deletedAt: null })
      .populate('createdBy', 'name email')
      .lean();

    if (!event) {
      console.log('[Event:Get] Event not found:', id);
      return apiError('Event not found', 'NOT_FOUND', 404);
    }

    const eventMedia = (event as { media?: unknown[] })?.media ?? [];
    console.log('[Event:Get] Event fetched:', {
      id,
      title: (event as { title?: string })?.title,
      mediaCount: Array.isArray(eventMedia) ? eventMedia.length : 0,
      mediaItems: Array.isArray(eventMedia)
        ? (eventMedia as { url?: string; type?: string }[]).map((m) => ({ url: m?.url?.slice?.(0, 50), type: m?.type }))
        : [],
      hasMediaField: 'media' in event,
    });

    return apiSuccess(event);
  } catch (err) {
    console.error('Get event error:', err);
    return apiError('Failed to fetch event', 'SERVER_ERROR', 500);
  }
}

/**
 * PUT /api/v1/admin/content/events/:id
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('Authorization');
  const admin = await requireAdmin(authHeader);
  if (!admin) {
    return apiUnauthorized('Authentication required');
  }

  try {
    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return apiError('Invalid event ID', 'VALIDATION_ERROR', 400);
    }

    const body = await request.json();
    const { title, description, date, time, location, media = [], scheduledAt } = body;

    console.log('[Event:Update] Request received:', {
      id,
      title: title?.slice?.(0, 50),
      mediaCount: Array.isArray(media) ? media.length : 0,
      mediaRaw: JSON.stringify(media),
    });

    if (!title || typeof title !== 'string' || !title.trim()) {
      return apiError('title is required', 'VALIDATION_ERROR', 400);
    }

    if (!date || typeof date !== 'string') {
      return apiError('date is required', 'VALIDATION_ERROR', 400);
    }

    if (!time || typeof time !== 'string' || !time.trim()) {
      return apiError('time is required', 'VALIDATION_ERROR', 400);
    }

    if (!location || typeof location !== 'string' || !location.trim()) {
      return apiError('location is required', 'VALIDATION_ERROR', 400);
    }

    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return apiError('Invalid date', 'VALIDATION_ERROR', 400);
    }

    const scheduledAtDate = scheduledAt ? new Date(scheduledAt) : null;
    if (scheduledAtDate && isNaN(scheduledAtDate.getTime())) {
      return apiError('Invalid scheduledAt date', 'VALIDATION_ERROR', 400);
    }

    const rawMedia = Array.isArray(media) ? media : [];
    const mediaArr = rawMedia
      .filter((m: unknown) => m && typeof m === 'object' && m !== null && 'url' in m && 'type' in m)
      .map((m: unknown) => {
        const item = m as Record<string, unknown>;
        return {
          url: String(item.url ?? ''),
          type: item.type === 'video' ? 'video' : 'image',
          publicId: item.publicId ? String(item.publicId) : undefined,
        };
      })
      .filter((m) => m.url.length > 0);

    if (mediaArr.length === 0) {
      return apiError('At least one image or video is required', 'VALIDATION_ERROR', 400);
    }

    console.log('[Event:Update] Parsed media:', {
      count: mediaArr.length,
      items: mediaArr.map((m) => ({ url: m.url?.slice?.(0, 60), type: m.type })),
    });

    await connectDB();

    const updateResult = await Event.collection.updateOne(
      { _id: new Types.ObjectId(id), deletedAt: null },
      {
        $set: {
          title: title.trim(),
          description: String(description ?? '').trim(),
          date: eventDate,
          time: String(time).trim(),
          location: location.trim(),
          media: mediaArr,
          scheduledAt: scheduledAtDate,
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return apiError('Event not found', 'NOT_FOUND', 404);
    }

    const event = await Event.findById(id)
      .populate('createdBy', 'name email')
      .lean();

    const savedMedia = (event as { media?: unknown[] })?.media ?? [];
    console.log('[Event:Update] Event saved:', {
      id,
      mediaInResponse: Array.isArray(savedMedia) ? savedMedia.length : 0,
      mediaUrls: Array.isArray(savedMedia) ? (savedMedia as { url?: string }[]).map((m) => m?.url?.slice?.(0, 50)) : [],
    });

    return apiSuccess(event, 'Event updated');
  } catch (err) {
    console.error('Update event error:', err);
    return apiError('Failed to update event', 'SERVER_ERROR', 500);
  }
}

/**
 * DELETE /api/v1/admin/content/events/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('Authorization');
  const admin = await requireAdmin(authHeader);
  if (!admin) {
    return apiUnauthorized('Authentication required');
  }

  try {
    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return apiError('Invalid event ID', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const event = await Event.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!event) {
      return apiError('Event not found', 'NOT_FOUND', 404);
    }

    return apiSuccess({ deleted: true }, 'Event deleted');
  } catch (err) {
    console.error('Delete event error:', err);
    return apiError('Failed to delete event', 'SERVER_ERROR', 500);
  }
}
