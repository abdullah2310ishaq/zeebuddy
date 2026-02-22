import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type CloudinaryFolder = 'posts' | 'businesses' | 'avatars' | 'events';

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
  duration?: number; // video duration in seconds
}

function getMimeType(resourceType: 'image' | 'video', file?: Blob | File): string {
  if (file && 'type' in file && file.type && file.type.startsWith('image/')) {
    return file.type;
  }
  if (file && 'type' in file && file.type && file.type.startsWith('video/')) {
    return file.type;
  }
  return resourceType === 'video' ? 'video/mp4' : 'image/jpeg';
}

export async function uploadToCloudinary(
  file: Buffer | string | Blob,
  folder: CloudinaryFolder,
  resourceType: 'image' | 'video' = 'image'
): Promise<UploadResult> {
  const fullFolder = `zeebuddy/${folder}`;

  let uploadSource: string;
  if (typeof file === 'string') {
    uploadSource = file;
  } else if (Buffer.isBuffer(file)) {
    const mime = resourceType === 'video' ? 'video/mp4' : 'image/jpeg';
    uploadSource = `data:${mime};base64,${file.toString('base64')}`;
  } else {
    const buf = Buffer.from(await (file as Blob).arrayBuffer());
    const mime = getMimeType(resourceType, file as Blob);
    uploadSource = `data:${mime};base64,${buf.toString('base64')}`;
  }

  const result = await cloudinary.uploader.upload(uploadSource, {
    folder: fullFolder,
    resource_type: resourceType,
    overwrite: false,
  });

  const out: UploadResult = {
    url: result.secure_url,
    publicId: result.public_id,
    secureUrl: result.secure_url,
  };
  if (resourceType === 'video') {
    const duration = (result as unknown as { duration?: number }).duration;
    if (typeof duration === 'number') {
      out.duration = duration;
    }
  }
  return out;
}

export async function deleteFromCloudinary(publicId: string, resourceType: 'image' | 'video' = 'image') {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export { cloudinary };
