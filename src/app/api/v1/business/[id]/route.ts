import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Business } from '@/models';
import { apiSuccess, apiError, apiNotFound } from '@/lib/api-response';
import mongoose from 'mongoose';

type BusinessMediaType = 'image' | 'video';
type BusinessMediaItem = { url: string; type: BusinessMediaType; publicId?: string };

function toMedia(b: { media?: unknown; images?: unknown }): BusinessMediaItem[] {
  const mediaRaw = (b as { media?: unknown }).media;
  if (Array.isArray(mediaRaw)) {
    const cleaned = mediaRaw
      .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
      .map((m) => ({
        url: typeof m.url === 'string' ? m.url.trim() : '',
        type: m.type === 'video' ? ('video' as const) : ('image' as const),
        publicId: typeof m.publicId === 'string' && m.publicId.trim() ? m.publicId.trim() : undefined,
      }))
      .filter((m) => !!m.url);
    if (cleaned.length > 0) return cleaned;
  }

  const imagesRaw = (b as { images?: unknown }).images;
  if (Array.isArray(imagesRaw)) {
    return imagesRaw
      .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
      .map((u) => ({ url: u.trim(), type: 'image' as const }));
  }
  return [];
}

function mediaToLegacyImages(media: BusinessMediaItem[]): string[] {
  return Array.from(new Set(media.filter((m) => m.type === 'image').map((m) => m.url)));
}

/** Ensure services is always string[] for response (legacy DB may have string). */
function servicesForResponse(b: { services?: string[] | string }): string[] {
  const s = b.services;
  if (Array.isArray(s)) return s;
  if (typeof s === 'string' && s) return [s];
  return [];
}

/**
 * GET /api/v1/business/:id
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return apiNotFound('Business not found');

    await connectDB();
    const business = await Business.findOne({ _id: id, deletedAt: null }).lean();

    if (!business) return apiNotFound('Business not found');

    const media = toMedia(business);
    return apiSuccess({
      id: business._id,
      ...business,
      services: servicesForResponse(business),
      media,
      images: mediaToLegacyImages(media),
    });
  } catch (err) {
    console.error('Business fetch error:', err);
    return apiError('Failed to fetch business', 'SERVER_ERROR', 500);
  }
}

/** Normalize services to array of 1–3 strings. */
function normalizeServices(v: unknown): string[] | null {
  if (v === undefined || v === null) return null;
  if (Array.isArray(v)) {
    const arr = v.filter((s) => typeof s === 'string').map((s) => String(s).trim()).filter(Boolean);
    if (arr.length === 0) return null;
    return arr.length > 3 ? arr.slice(0, 3) : arr;
  }
  if (typeof v === 'string' && v.trim()) return [v.trim()];
  return null;
}

/**
 * PUT /api/v1/business/:id
 * services: string[] (max 3) or single string
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return apiNotFound('Business not found');

    await connectDB();
    const body = await request.json();
    const {
      businessName,
      services: servicesRaw,
      serviceHours,
      businessDescription,
      businessType,
      serviceAreas,
      images,
      media,
    } = body;

    const services = normalizeServices(servicesRaw);
    if (services !== null && services.length > 3) {
      return apiError('Maximum 3 services allowed per business', 'VALIDATION_ERROR', 400);
    }

    const parsedMedia: BusinessMediaItem[] = Array.isArray(media)
      ? media
          .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
          .map((m) => ({
            url: typeof m.url === 'string' ? m.url.trim() : '',
            type: m.type === 'video' ? ('video' as const) : ('image' as const),
            publicId: typeof m.publicId === 'string' && m.publicId.trim() ? m.publicId.trim() : undefined,
          }))
          .filter((m) => !!m.url)
      : [];

    const legacyImages: string[] = Array.isArray(images)
      ? images.filter((u): u is string => typeof u === 'string' && u.trim().length > 0).map((u) => u.trim())
      : [];

    const mediaFinal = parsedMedia.length > 0 ? parsedMedia : legacyImages.length > 0 ? legacyImages.map((u) => ({ url: u, type: 'image' as const })) : null;

    const business = await Business.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        ...(businessName && { businessName }),
        ...(services !== null && { services }),
        ...(serviceHours !== undefined && { serviceHours }),
        ...(businessDescription !== undefined && { businessDescription }),
        ...(businessType && { businessType }),
        ...(serviceAreas !== undefined && { serviceAreas }),
        ...(mediaFinal !== null && { media: mediaFinal, images: mediaToLegacyImages(mediaFinal) }),
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();

    if (!business) return apiNotFound('Business not found');

    const outMedia = toMedia(business);
    return apiSuccess({
      id: business._id,
      ...business,
      services: servicesForResponse(business),
      media: outMedia,
      images: mediaToLegacyImages(outMedia),
    });
  } catch (err) {
    console.error('Business update error:', err);
    return apiError('Failed to update business', 'SERVER_ERROR', 500);
  }
}

/**
 * DELETE /api/v1/business/:id
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return apiNotFound('Business not found');

    await connectDB();
    const business = await Business.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), updatedAt: new Date() },
      { new: true }
    );

    if (!business) return apiNotFound('Business not found');

    return apiSuccess({ message: 'Business deleted successfully' });
  } catch (err) {
    console.error('Business delete error:', err);
    return apiError('Failed to delete business', 'SERVER_ERROR', 500);
  }
}
