import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Business } from '@/models';
import { apiSuccess, apiError } from '@/lib/api-response';

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

    return apiSuccess(
      businesses.map((b) => ({
        id: b._id,
        businessName: b.businessName,
        services: b.services,
        serviceHours: b.serviceHours,
        businessDescription: b.businessDescription,
        businessType: b.businessType,
        serviceAreas: b.serviceAreas,
        images: b.images,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      }))
    );
  } catch (err) {
    console.error('Business fetch error:', err);
    return apiError('Failed to fetch businesses', 'SERVER_ERROR', 500);
  }
}

/**
 * POST /api/v1/business
 * Create new business (admin only - add auth later)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      businessName,
      services,
      serviceHours,
      businessDescription,
      businessType,
      serviceAreas,
      images = [],
    } = body;

    if (!businessName || !services || !businessType) {
      return apiError('businessName, services, and businessType are required', 'VALIDATION_ERROR', 400);
    }

    const business = await Business.create({
      businessName,
      services,
      serviceHours: serviceHours || '',
      businessDescription: businessDescription || '',
      businessType,
      serviceAreas: serviceAreas || '',
      images: Array.isArray(images) ? images : [],
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
        images: business.images,
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
