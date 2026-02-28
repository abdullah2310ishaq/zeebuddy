import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Event } from '@/models';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { Types } from 'mongoose';

/**
 * GET /api/v1/admin/content/events
 * List all events (admin)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const admin = await requireAdmin(authHeader);
  if (!admin) {
    return apiUnauthorized('Authentication required');
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const events = await Event.find({ deletedAt: null })
      .populate('createdBy', 'name email')
      .sort({ date: 1 })
      .limit(limit)
      .lean();

    console.log('[Event:List] Fetched events:', {
      count: events.length,
      ids: events.map((e: { _id?: unknown }) => String(e._id)),
      mediaPerEvent: events.map((e: { media?: unknown[] }) => Array.isArray(e.media) ? e.media.length : 0),
    });

    return apiSuccess(events);
  } catch (err) {
    console.error('List events error:', err);
    return apiError('Failed to list events', 'SERVER_ERROR', 500);
  }
}

/**
 * POST /api/v1/admin/content/events
 * Create a new event
 * Body: { title, description?, date, time, location, media?, scheduledAt? }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const admin = await requireAdmin(authHeader);
  if (!admin) {
    return apiUnauthorized('Authentication required');
  }

  try {
    const body = await request.json();
    const { title, description, whatHappens, niche, date, time, location, media = [], scheduledAt } = body;

    console.log('[Event:Create] Request body received:', {
      title: title?.slice?.(0, 50),
      descriptionLength: description?.length ?? 0,
      date,
      time,
      location: location?.slice?.(0, 30),
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

    const mediaArr = Array.isArray(media)
      ? media
          .filter((m: unknown) => m && typeof m === 'object' && 'url' in m && 'type' in m)
          .map((m: { url: string; type: string; publicId?: string }) => ({
            url: String((m as { url: unknown }).url),
            type: (m as { type: string }).type === 'video' ? 'video' : 'image',
            publicId: (m as { publicId?: string }).publicId ? String((m as { publicId: string }).publicId) : undefined,
          }))
      : [];

    if (mediaArr.length === 0) {
      return apiError('At least one image or video is required', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const createPayload = {
      title: title.trim(),
      description: String(description ?? '').trim(),
      date: eventDate,
      time: String(time).trim(),
      location: location.trim(),
      media: mediaArr,
      createdBy: admin._id,
      scheduledAt: scheduledAtDate,
    };

    console.log('[Event:Create] Parsed media array:', {
      count: mediaArr.length,
      items: mediaArr.map((m) => ({ url: m.url?.slice?.(0, 60), type: m.type, hasPublicId: !!m.publicId })),
    });
    console.log('[Event:Create] Saving to DB with payload.media length:', createPayload.media.length);

    // Use native MongoDB insert to ensure media array is persisted (Mongoose subdoc arrays can fail to save)
    const rawDoc = {
      title: createPayload.title,
      description: createPayload.description,
      whatHappens: typeof whatHappens === 'string' ? whatHappens.trim() : '',
      niche: typeof niche === 'string' ? niche.trim() : '',
      date: createPayload.date,
      time: createPayload.time,
      location: createPayload.location,
      media: createPayload.media,
      createdBy: new Types.ObjectId(String(admin._id)),
      attendeesCount: 0,
      scheduledAt: createPayload.scheduledAt,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const insertResult = await Event.collection.insertOne(rawDoc);
    const event = { _id: insertResult.insertedId };

    const populated = await Event.findById(event._id)
      .populate('createdBy', 'name email')
      .lean();

    const savedMedia = (populated as { media?: unknown[] })?.media ?? [];
    console.log('[Event:Create] Event saved successfully:', {
      id: event._id,
      title: populated?.title,
      mediaInResponse: Array.isArray(savedMedia) ? savedMedia.length : 0,
      mediaUrls: Array.isArray(savedMedia) ? (savedMedia as { url?: string }[]).map((m) => m?.url?.slice?.(0, 50)) : [],
    });

    return apiSuccess(populated, 'Event created', 201);
  } catch (err) {
    console.error('Create event error:', err);
    return apiError('Failed to create event', 'SERVER_ERROR', 500);
  }
}
