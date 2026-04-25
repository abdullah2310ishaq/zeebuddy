import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Business } from '@/models';
import { apiSuccess, apiError } from '@/lib/api-response';

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

/**
 * GET /api/v1/business
 * Returns list of all businesses (MongoDB)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const businesses = await Business.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .lean();

    const servicesForResponse = (b: { services?: string[] | string }): string[] => {
      const s = b.services;
      if (Array.isArray(s)) return s;
      if (typeof s === 'string' && s) return [s];
      return [];
    };

    return apiSuccess(
      businesses.map((b) => ({
        id: b._id,
        businessName: b.businessName,
        services: servicesForResponse(b),
        serviceHours: b.serviceHours,
        businessDescription: b.businessDescription,
        businessType: b.businessType,
        serviceAreas: b.serviceAreas,
        media: toMedia(b),
        images: mediaToLegacyImages(toMedia(b)),
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      }))
    );
  } catch (err) {
    console.error('Business fetch error:', err);
    return apiError('Failed to fetch businesses', 'SERVER_ERROR', 500);
  }
}

/** Normalize services to array of 1–3 strings for business. */
function normalizeServices(v: unknown): string[] {
  if (Array.isArray(v)) {
    const arr = v.filter((s) => typeof s === 'string').map((s) => String(s).trim()).filter(Boolean);
    return arr.slice(0, 3);
  }
  if (typeof v === 'string' && v.trim()) return [v.trim()];
  return [];
}

/**
 * POST /api/v1/business
 * Create new business (admin only - add auth later)
 * services: string[] (max 3) or single string
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      businessName,
      services: servicesRaw,
      serviceHours,
      businessDescription,
      businessType,
      serviceAreas,
      images = [],
      media,
    } = body;

    if (!businessName || !businessType) {
      return apiError('businessName and businessType are required', 'VALIDATION_ERROR', 400);
    }

    const services = normalizeServices(servicesRaw);
    if (services.length === 0) {
      return apiError('At least one service is required', 'VALIDATION_ERROR', 400);
    }
    if (services.length > 3) {
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

    const mediaFinal = parsedMedia.length > 0 ? parsedMedia : legacyImages.map((u) => ({ url: u, type: 'image' as const }));

    const business = await Business.create({
      businessName,
      services,
      serviceHours: serviceHours || '',
      businessDescription: businessDescription || '',
      businessType,
      serviceAreas: serviceAreas || '',
      media: mediaFinal,
      images: mediaToLegacyImages(mediaFinal),
    });

    return apiSuccess(
      {
        id: business._id,
        businessName: business.businessName,
        services: business.services,
        serviceHours: business.serviceHours,
        businessDescription: business.businessDescription,
        businessType: business.businessType,
        serviceAreas: business.serviceAreas,
        media: mediaFinal,
        images: mediaToLegacyImages(mediaFinal),
        createdAt: business.createdAt,
        updatedAt: business.updatedAt,
      },
      'Business created successfully',
      201
    );
  } catch (err) {
    console.error('Business create error:', err);
    return apiError('Failed to create business', 'SERVER_ERROR', 500);
  }
}
