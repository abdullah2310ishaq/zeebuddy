import { NextRequest } from 'next/server';
import { uploadToCloudinary, deleteFromCloudinary, type CloudinaryFolder } from '@/lib/cloudinary';
import { apiSuccess, apiError } from '@/lib/api-response';
import { requireAdmin } from '@/lib/auth';

const MAX_VIDEO_DURATION_SEC = 120;

/**
 * POST /api/v1/upload
 * Upload image or video to Cloudinary
 * FormData: file (required), folder (posts|businesses|avatars|events), type (image|video)
 * Videos: max 120 seconds duration
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as CloudinaryFolder) || 'posts';
    const type = (formData.get('type') as 'image' | 'video') || 'image';

    console.log('[Upload] Request:', { folder, type, hasFile: !!file, fileName: file?.name, fileSize: file?.size });

    if (!file) {
      return apiError('file is required', 'VALIDATION_ERROR', 400);
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('[Upload] Missing Cloudinary env vars. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local');
      return apiError('Cloudinary not configured. Add CLOUDINARY_* vars to .env.local', 'CONFIG_ERROR', 500);
    }

    const validFolders: CloudinaryFolder[] = ['posts', 'businesses', 'avatars', 'events'];
    if (!validFolders.includes(folder)) {
      return apiError('Invalid folder. Must be: posts, businesses, avatars, events', 'VALIDATION_ERROR', 400);
    }

    if (folder === 'avatars' && type !== 'image') {
      return apiError('Avatar uploads must be images only (use type=image)', 'VALIDATION_ERROR', 400);
    }

    const result = await uploadToCloudinary(file, folder, type);
    console.log('[Upload] Cloudinary success:', { url: result.url, publicId: result.publicId });

    if (type === 'video' && result.duration != null && result.duration > MAX_VIDEO_DURATION_SEC) {
      await deleteFromCloudinary(result.publicId, 'video');
      return apiError(`Video must be 120 seconds or less (current: ${Math.ceil(result.duration)}s)`, 'VIDEO_TOO_LONG', 400);
    }

    return apiSuccess(
      {
        url: result.url,
        publicId: result.publicId,
        secureUrl: result.secureUrl,
        duration: result.duration,
      },
      'Upload successful',
      201
    );
  } catch (err) {
    let message = 'Upload failed';
    if (err instanceof Error) {
      message = err.message;
      console.error('[Upload] Error:', message);
      console.error('[Upload] Stack:', err.stack);
    } else if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>;
      if (e.error && typeof e.error === 'object' && e.error !== null && 'message' in e.error) {
        message = String((e.error as { message: string }).message);
      } else if ('message' in e && typeof e.message === 'string') {
        message = e.message;
      }
      console.error('[Upload] Error object:', JSON.stringify(err, null, 2));
    }
    return apiError(message, 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request.headers.get('Authorization'));
  if (!admin) return apiError('Authentication required', 'UNAUTHORIZED', 401);

  try {
    const body: unknown = await request.json().catch(() => null);
    const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const publicId = typeof record.publicId === 'string' ? record.publicId.trim() : '';
    const resourceType = record.type === 'video' ? 'video' : 'image';

    if (!publicId) {
      return apiError('publicId is required', 'VALIDATION_ERROR', 400);
    }

    await deleteFromCloudinary(publicId, resourceType);
    return apiSuccess({ publicId }, 'Media deleted');
  } catch (err) {
    console.error('[Upload Delete] Error:', err);
    return apiError('Failed to delete media', 'SERVER_ERROR', 500);
  }
}
