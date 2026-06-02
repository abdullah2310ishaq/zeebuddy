import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Business } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { apiSuccess, apiError, apiNotFound, apiUnauthorized } from "@/lib/api-response";
import {
  mediaToLegacyImages,
  mergeServiceMutations,
  parseUpdateBusinessPayload,
} from "@/lib/validation/business";
import type { BusinessEntity, BusinessMediaItem, UpdateBusinessRequest } from "@/types/business";
import type { ValidationResult } from "@/lib/validation/business";

function toMedia(business: { media?: unknown; images?: unknown }): BusinessMediaItem[] {
  if (Array.isArray(business.media)) {
    const cleaned = business.media
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item) => ({
        url: typeof item.url === "string" ? item.url.trim() : "",
        type: item.type === "video" ? ("video" as const) : ("image" as const),
        publicId:
          typeof item.publicId === "string" && item.publicId.trim() ? item.publicId.trim() : undefined,
      }))
      .filter((item) => item.url.length > 0);
    if (cleaned.length > 0) return cleaned;
  }

  if (Array.isArray(business.images)) {
    return business.images
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
 * GET /api/v1/business/:id
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return apiNotFound('Business not found');

    await connectDB();
    const business = await Business.findOne({ _id: id, deletedAt: null }).lean();

    if (!business) return apiNotFound('Business not found');

    return apiSuccess<BusinessEntity>(mapBusinessEntity(business));
  } catch (err) {
    console.error("Business fetch error:", err);
    return apiError("Failed to fetch business", "SERVER_ERROR", 500);
  }
}

function applyBusinessUpdate(
  current: { services?: string[] | string; media?: unknown; images?: unknown },
  update: UpdateBusinessRequest
): ValidationResult<Record<string, unknown>> {
  const nextServicesResult = mergeServiceMutations(servicesForResponse(current), update);
  if (!nextServicesResult.success || !nextServicesResult.data) {
    return {
      success: false,
      error: nextServicesResult.error,
      code: nextServicesResult.code,
    };
  }

  const updateDoc: Record<string, unknown> = {
    services: nextServicesResult.data,
    updatedAt: new Date(),
  };

  if (update.businessName !== undefined) updateDoc.businessName = update.businessName;
  if (update.businessType !== undefined) updateDoc.businessType = update.businessType;
  if (update.serviceHours !== undefined) updateDoc.serviceHours = update.serviceHours;
  if (update.businessDescription !== undefined) updateDoc.businessDescription = update.businessDescription;
  if (update.serviceAreas !== undefined) updateDoc.serviceAreas = update.serviceAreas;
  if (update.media !== undefined) {
    updateDoc.media = update.media;
    updateDoc.images = mediaToLegacyImages(update.media);
  }

  return { success: true, data: updateDoc };
}

/**
 * PUT /api/v1/business/:id
 * services: string[] (max 3) or single string
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get("Authorization");
  const admin = await requireAdmin(authHeader);
  if (!admin) return apiUnauthorized("Authentication required");

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return apiNotFound("Business not found");

    await connectDB();
    const body = await request.json();
    const parsed = parseUpdateBusinessPayload(body);
    if (!parsed.success || !parsed.data) {
      return apiError(parsed.error ?? "Validation failed", parsed.code ?? "VALIDATION_ERROR", 400);
    }

    const currentBusiness = await Business.findOne({ _id: id, deletedAt: null }).lean();
    if (!currentBusiness) return apiNotFound("Business not found");

    const updateDocResult = applyBusinessUpdate(currentBusiness, parsed.data);
    if (!updateDocResult.success || !updateDocResult.data) {
      return apiError(updateDocResult.error ?? "Validation failed", updateDocResult.code ?? "VALIDATION_ERROR", 400);
    }

    const business = await Business.findOneAndUpdate(
      { _id: id, deletedAt: null },
      updateDocResult.data,
      { new: true }
    ).lean();

    if (!business) return apiNotFound("Business not found");

    return apiSuccess<BusinessEntity>(mapBusinessEntity(business), "Business updated successfully");
  } catch (err) {
    console.error("Business update error:", err);
    return apiError("Failed to update business", "SERVER_ERROR", 500);
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return PATCH(request, context);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get("Authorization");
  const admin = await requireAdmin(authHeader);
  if (!admin) return apiUnauthorized("Authentication required");

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return apiNotFound("Business not found");

    await connectDB();
    const business = await Business.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), updatedAt: new Date() },
      { new: true }
    );

    if (!business) return apiNotFound("Business not found");

    return apiSuccess({ id: String(business._id) }, "Business deleted successfully");
  } catch (err) {
    console.error("Business delete error:", err);
    return apiError("Failed to delete business", "SERVER_ERROR", 500);
  }
}
