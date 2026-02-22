import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Business, BusinessBooking } from '@/models';
import { requireUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/lib/api-response';
import mongoose from 'mongoose';

/**
 * POST /api/v1/business/:id/booking
 * Book a service at a business. Body: { notes?: string }
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
      return apiError('Invalid business ID', 'VALIDATION_ERROR', 400);
    }

    const body = await request.json().catch(() => ({}));
    const notes = typeof body?.notes === 'string' ? body.notes.trim() : '';

    await connectDB();

    const business = await Business.findOne({ _id: id, deletedAt: null });
    if (!business) return apiNotFound('Business not found');

    const existing = await BusinessBooking.findOne({ businessId: id, userId: user._id, status: { $ne: 'cancelled' } });
    if (existing) {
      return apiError('You already have a booking for this business', 'ALREADY_BOOKED', 400);
    }

    const booking = await BusinessBooking.create({
      businessId: id,
      userId: user._id,
      status: 'pending',
      notes,
    });

    const populated = await BusinessBooking.findById(booking._id)
      .populate('businessId', 'businessName services')
      .lean();

    return apiSuccess(populated, 'Booking created', 201);
  } catch (err) {
    console.error('Business booking error:', err);
    return apiError('Failed to create booking', 'SERVER_ERROR', 500);
  }
}
