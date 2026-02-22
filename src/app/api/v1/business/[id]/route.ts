import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Business } from '@/models';
import { apiSuccess, apiError, apiNotFound } from '@/lib/api-response';
import mongoose from 'mongoose';

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
    });
  } catch (err) {
    console.error('Business fetch error:', err);
    return apiError('Failed to fetch business', 'SERVER_ERROR', 500);
  }
}

/**
 * PUT /api/v1/business/:id
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return apiNotFound('Business not found');

    await connectDB();
    const body = await request.json();
    const {
      businessName,
      services,
      serviceHours,
      businessDescription,
      businessType,
      serviceAreas,
      images,
    } = body;

    const business = await Business.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        ...(businessName && { businessName }),
        ...(services && { services }),
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
