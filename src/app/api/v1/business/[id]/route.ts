import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Business } from '@/models';
import { apiSuccess, apiError, apiNotFound } from '@/lib/api-response';
import mongoose from 'mongoose';

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

    return apiSuccess({
      id: business._id,
      ...business,
      services: servicesForResponse(business),
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
    } = body;

    const services = normalizeServices(servicesRaw);
    if (services !== null && services.length > 3) {
      return apiError('Maximum 3 services allowed per business', 'VALIDATION_ERROR', 400);
    }

    const business = await Business.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        ...(businessName && { businessName }),
        ...(services !== null && { services }),
        ...(serviceHours !== undefined && { serviceHours }),
        ...(businessDescription !== undefined && { businessDescription }),
        ...(businessType && { businessType }),
        ...(serviceAreas !== undefined && { serviceAreas }),
        ...(Array.isArray(images) && { images }),
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();

    if (!business) return apiNotFound('Business not found');

    return apiSuccess({
      id: business._id,
      ...business,
      services: servicesForResponse(business),
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
