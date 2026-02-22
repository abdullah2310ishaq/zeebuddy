import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { Category } from '@/models';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

/**
 * GET /api/v1/categories
 * List all categories (for dropdowns)
 */
export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    const categories = await Category.find().sort({ name: 1 }).lean();
    return apiSuccess(categories);
  } catch (err) {
    console.error('Categories list error:', err);
    return apiError('Failed to fetch categories', 'SERVER_ERROR', 500);
  }
}

/**
 * POST /api/v1/categories
 * Create a new category (admin only). Used for type-to-add when admin presses Enter.
 * Body: { name: string }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const admin = await requireAdmin(authHeader);
  if (!admin) {
    return apiUnauthorized('Authentication required');
  }

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return apiError('name is required', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) {
      return apiError('Invalid category name', 'VALIDATION_ERROR', 400);
    }

    const existing = await Category.findOne({
      $or: [{ slug }, { name: { $regex: new RegExp(`^${name}$`, 'i') } }],
    });
    if (existing) {
      return apiSuccess(existing.toObject(), 'Category already exists');
    }

    const category = await Category.create({ name, slug });
    return apiSuccess(category.toObject(), 'Category created', 201);
  } catch (err) {
    console.error('Create category error:', err);
    return apiError('Failed to create category', 'SERVER_ERROR', 500);
  }
}
