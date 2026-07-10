import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Business } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/api-response";
import { mapBusinessMediaItem, mediaToLegacyImages, parseCreateBusinessPayload } from "@/lib/validation/business";
import type { BusinessEntity, BusinessMediaItem } from "@/types/business";

function toMedia(b: { media?: unknown; images?: unknown }): BusinessMediaItem[] {
  if (Array.isArray(b.media)) {
    const cleaned = b.media
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map(mapBusinessMediaItem)
      .filter((item): item is BusinessMediaItem => item !== null);
    if (cleaned.length > 0) return cleaned;
  }

  if (Array.isArray(b.images)) {
    return b.images
      .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
      .map((url) => ({ url: url.trim(), type: "image" as const }));
  }

  return [];
}

function servicesForResponse(business: { services?: string[] | string }): string[] {
  const { services } = business;
  if (Array.isArray(services)) return services;
  if (typeof services === "string" && services.trim()) return [services.trim()];
  return [];
}

function mapBusinessEntity(business: {
  _id: unknown;
  businessName: string;
  services?: string[] | string;
  serviceHours?: string;
  businessDescription?: string;
  businessType: string;
  serviceAreas?: string;
  media?: unknown;
  images?: unknown;
  createdAt: Date;
  updatedAt: Date;
}): BusinessEntity {
  const media = toMedia(business);
  return {
    id: String(business._id),
    businessName: business.businessName,
    services: servicesForResponse(business),
    serviceHours: business.serviceHours ?? "",
    businessDescription: business.businessDescription ?? "",
    businessType: business.businessType,
    serviceAreas: business.serviceAreas ?? "",
    media,
    images: mediaToLegacyImages(media),
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString(),
  };
}

/**
 * GET /api/v1/business
 * Returns list of all businesses (MongoDB)
 */
export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const businesses = await Business.find({ deletedAt: null }).sort({ createdAt: -1 }).lean();
    return apiSuccess<BusinessEntity[]>(businesses.map((business) => mapBusinessEntity(business)));
  } catch (err) {
    console.error("Business fetch error:", err);
    return apiError("Failed to fetch businesses", "SERVER_ERROR", 500);
  }
}

/**
 * POST /api/v1/business
 * Create new business (admin only - add auth later)
 * services: string[] (max 3) or single string
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const admin = await requireAdmin(authHeader);
  if (!admin) return apiUnauthorized("Authentication required");

  try {
    await connectDB();
    const body = await request.json();
    const parsed = parseCreateBusinessPayload(body);
    if (!parsed.success || !parsed.data) {
      return apiError(parsed.error ?? "Validation failed", parsed.code ?? "VALIDATION_ERROR", 400);
    }
    const payload = parsed.data;
    const mediaFinal = payload.media ?? [];

    const business = await Business.create({
      businessName: payload.businessName,
      services: payload.services,
      serviceHours: payload.serviceHours ?? "",
      businessDescription: payload.businessDescription ?? "",
      businessType: payload.businessType,
      serviceAreas: payload.serviceAreas ?? "",
      media: mediaFinal,
      images: mediaToLegacyImages(mediaFinal),
    });

    return apiSuccess<BusinessEntity>(mapBusinessEntity(business.toObject()), "Business created successfully", 201);
  } catch (err) {
    console.error("Business create error:", err);
    return apiError("Failed to create business", "SERVER_ERROR", 500);
  }
}
