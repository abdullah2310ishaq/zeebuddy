import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { requireUser } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/v1/user/profile/avatar
 * Upload avatar image for the current user. Requires Bearer token.
 * FormData: file (required, image only: jpeg/png/gif/webp, max 5MB)
 * Uploads to Cloudinary (avatars), sets user.avatarUrl, returns updated profile.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request.headers.get('Authorization'));
    if (!user) return apiUnauthorized();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || !(file instanceof File)) {
      return apiError('file is required', 'VALIDATION_ERROR', 400);
    }

    const mime = (file.type ?? '').toLowerCase();
    if (!mime.startsWith('image/')) {
      return apiError('Only image files are allowed (e.g. JPEG, PNG, GIF, WebP)', 'VALIDATION_ERROR', 400);
    }
    if (file.size <= 0 || file.size > MAX_AVATAR_SIZE_BYTES) {
      return apiError('Image must be between 1 byte and 5 MB', 'VALIDATION_ERROR', 400);
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return apiError('Avatar upload not configured', 'CONFIG_ERROR', 500);
    }

    let result: { url: string; publicId: string; secureUrl: string };
    try {
      result = await uploadToCloudinary(file, 'avatars', 'image');
    } catch (err) {
      console.error('Avatar upload error:', err);
      return apiError('Upload failed', 'SERVER_ERROR', 500);
    }

    const avatarUrl = result.secureUrl ?? result.url;
    await connectDB();

    const updated = await User.findByIdAndUpdate(
      user._id,
      { avatarUrl, updatedAt: new Date() },
      { new: true }
    )
      .select('-passwordHash -firebaseUid -__v')
      .lean();

    if (!updated) {
      await deleteFromCloudinary(result.publicId, 'image');
      return apiError('User not found', 'NOT_FOUND', 404);
    }

    const { passwordHash, firebaseUid, __v, ...safe } = updated as unknown as Record<string, unknown>;
    return apiSuccess(safe, 'Avatar updated', 200);
  } catch (err) {
    console.error('Avatar update error:', err);
    return apiError('Failed to update avatar', 'SERVER_ERROR', 500);
  }
}
