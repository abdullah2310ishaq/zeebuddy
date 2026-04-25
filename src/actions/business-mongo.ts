'use server';

import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import { Business } from '@/models';
import { uploadToCloudinary } from '@/lib/cloudinary';

type BusinessMediaType = 'image' | 'video';
export interface BusinessMediaItem {
  url: string;
  type: BusinessMediaType;
  publicId?: string;
}

export interface BusinessFormData {
  businessName: string;
  /** 1 to 3 services per business */
  services: string[];
  serviceHours?: string;
  businessDescription?: string;
  businessType: string;
  serviceAreas?: string;
  images?: File[];
  existingImages?: string[];
  media?: BusinessMediaItem[];
}

export interface SaveBusinessResult {
  success: boolean;
  message: string;
  businessId?: string;
}

export interface GetBusinessesResult {
  success: boolean;
  businesses?: Array<{
    id: string;
    businessName: string;
    services: string[];
    serviceHours: string;
    businessDescription: string;
    businessType: string;
    serviceAreas: string;
    media?: BusinessMediaItem[];
    images: string[];
    createdAt: Date;
    updatedAt: Date;
  }>;
  message?: string;
}

function uniqStrings(items: string[]): string[] {
  return Array.from(new Set(items.map((s) => s.trim()).filter(Boolean)));
}

function getStringArrayFromForm(formData: FormData, key: string): string[] {
  const rawValue = formData.get(key);
  if (typeof rawValue !== 'string' || !rawValue.trim()) return [];

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());
  } catch {
    return [];
  }
}

function getMediaFromForm(formData: FormData): BusinessMediaItem[] {
  const raw = formData.get('existingMedia');
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((m): m is BusinessMediaItem => {
            if (!m || typeof m !== 'object') return false;
            const rec = m as Record<string, unknown>;
            const url = rec.url;
            const type = rec.type;
            if (typeof url !== 'string' || !url.trim()) return false;
            if (type !== 'image' && type !== 'video') return false;
            const publicId = rec.publicId;
            return publicId === undefined || typeof publicId === 'string';
          })
          .map((m) => ({
            url: m.url.trim(),
            type: m.type,
            ...(m.publicId ? { publicId: m.publicId } : {}),
          }));
      }
    } catch {
      // ignore
    }
  }

  // Legacy fallback: treat existingImages as image media.
  const legacyImages = getStringArrayFromForm(formData, 'existingImages');
  return legacyImages.map((url) => ({ url, type: 'image' as const }));
}

function mediaToLegacyImages(media: BusinessMediaItem[]): string[] {
  return uniqStrings(media.filter((m) => m.type === 'image').map((m) => m.url));
}

async function uploadFiles(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await uploadToCloudinary(buffer, 'businesses', 'image');
    urls.push(result.url);
  }
  return urls;
}

/** Get 1–3 services from form (getAll or single get). */
function getServicesFromForm(formData: FormData): string[] {
  const all = formData.getAll('services');
  const arr = all
    .filter((s) => typeof s === 'string' && (s as string).trim())
    .map((s) => (s as string).trim())
    .slice(0, 3);
  return arr;
}

export async function saveBusinessMongo(formData: FormData): Promise<SaveBusinessResult> {
  try {
    const businessName = formData.get('businessName') as string;
    const services = getServicesFromForm(formData);
    const serviceHours = (formData.get('serviceHours') as string) || '';
    const businessDescription = (formData.get('businessDescription') as string) || '';
    const businessType = formData.get('businessType') as string;
    const serviceAreas = (formData.get('serviceAreas') as string) || '';

    if (!businessName || !businessType) {
      return { success: false, message: 'Business name and business type are required' };
    }
    if (services.length === 0) {
      return { success: false, message: 'At least one service is required (max 3)' };
    }

    const imageFiles: File[] = [];
    for (const entry of formData.getAll('images')) {
      if (entry instanceof File && entry.size > 0) imageFiles.push(entry);
    }

    const existingMedia = getMediaFromForm(formData);
    const existingImages = mediaToLegacyImages(existingMedia);

    let imageUrls: string[] = [...existingImages];
    if (imageFiles.length > 0) {
      const uploaded = await uploadFiles(imageFiles);
      imageUrls = uniqStrings([...imageUrls, ...uploaded]);
    }

    const uploadedImageMedia: BusinessMediaItem[] = imageUrls
      .filter((url) => !existingImages.includes(url))
      .map((url) => ({ url, type: 'image' as const }));

    const media: BusinessMediaItem[] = [
      ...existingMedia.filter((m) => m.type !== 'image'),
      ...existingMedia.filter((m) => m.type === 'image'),
      ...uploadedImageMedia,
    ];

    await connectDB();
    const business = await Business.create({
      businessName,
      services,
      serviceHours,
      businessDescription,
      businessType,
      serviceAreas,
      media,
      images: mediaToLegacyImages(media),
    });

    revalidatePath('/local-business');
    return { success: true, message: 'Business saved successfully', businessId: String(business._id) };
  } catch (err) {
    console.error('Save business error:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to save business',
    };
  }
}

export async function getBusinessesMongo(): Promise<GetBusinessesResult> {
  try {
    await connectDB();
    const businesses = await Business.find({ deletedAt: null }).sort({ createdAt: -1 }).lean();

    const toServices = (s: string[] | string | undefined): string[] =>
      Array.isArray(s) ? s : typeof s === 'string' && s ? [s] : [];

    return {
      success: true,
      businesses: businesses.map((b) => ({
        id: String(b._id),
        businessName: b.businessName,
        services: toServices(b.services),
        serviceHours: b.serviceHours,
        businessDescription: b.businessDescription,
        businessType: b.businessType,
        serviceAreas: b.serviceAreas,
        media: Array.isArray((b as { media?: unknown }).media) ? (b as { media: BusinessMediaItem[] }).media : undefined,
        images: b.images,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    };
  } catch (err) {
    console.error('Get businesses error:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to fetch businesses',
    };
  }
}

export async function updateBusinessMongo(
  businessId: string,
  formData: FormData
): Promise<{ success: boolean; message: string; business?: GetBusinessesResult['businesses'] extends (infer B)[] | undefined ? B : never }> {
  try {
    const businessName = formData.get('businessName') as string;
    const services = getServicesFromForm(formData);
    const serviceHours = (formData.get('serviceHours') as string) || '';
    const businessDescription = (formData.get('businessDescription') as string) || '';
    const businessType = formData.get('businessType') as string;
    const serviceAreas = (formData.get('serviceAreas') as string) || '';

    const existingMedia = getMediaFromForm(formData);
    const existingImages = mediaToLegacyImages(existingMedia);
    let imageUrls: string[] = [...existingImages];

    const imageFiles: File[] = [];
    for (const entry of formData.getAll('images')) {
      if (entry instanceof File && entry.size > 0) imageFiles.push(entry);
    }
    if (imageFiles.length > 0) {
      const newUrls = await uploadFiles(imageFiles);
      imageUrls = uniqStrings([...imageUrls, ...newUrls]);
    }

    const uploadedImageMedia: BusinessMediaItem[] = imageUrls
      .filter((url) => !existingImages.includes(url))
      .map((url) => ({ url, type: 'image' as const }));

    const media: BusinessMediaItem[] = [
      ...existingMedia.filter((m) => m.type !== 'image'),
      ...existingMedia.filter((m) => m.type === 'image'),
      ...uploadedImageMedia,
    ];

    if (!businessName || !businessType) {
      return { success: false, message: 'Business name and business type are required' };
    }
    if (services.length === 0) {
      return { success: false, message: 'At least one service is required (max 3)' };
    }

    await connectDB();
    const business = await Business.findOneAndUpdate(
      { _id: businessId, deletedAt: null },
      {
        businessName,
        services,
        serviceHours,
        businessDescription,
        businessType,
        serviceAreas,
        media,
        images: mediaToLegacyImages(media),
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();

    if (!business) return { success: false, message: 'Business not found' };

    const toServices = (s: string[] | string | undefined): string[] =>
      Array.isArray(s) ? s : typeof s === 'string' && s ? [s] : [];

    revalidatePath('/local-business');
    return {
      success: true,
      message: 'Business updated successfully',
      business: {
        id: String(business._id),
        businessName: business.businessName,
        services: toServices(business.services),
        serviceHours: business.serviceHours,
        businessDescription: business.businessDescription,
        businessType: business.businessType,
        serviceAreas: business.serviceAreas,
        media: Array.isArray((business as { media?: unknown }).media)
          ? ((business as { media: BusinessMediaItem[] }).media as BusinessMediaItem[])
          : undefined,
        images: business.images,
        createdAt: business.createdAt,
        updatedAt: business.updatedAt,
      },
    };
  } catch (err) {
    console.error('Update business error:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to update business',
    };
  }
}

export async function deleteBusinessMongo(businessId: string): Promise<{ success: boolean; message: string }> {
  try {
    await connectDB();
    const business = await Business.findOneAndUpdate(
      { _id: businessId, deletedAt: null },
      { deletedAt: new Date(), updatedAt: new Date() }
    );
    if (!business) return { success: false, message: 'Business not found' };
    revalidatePath('/local-business');
    return { success: true, message: 'Business deleted successfully' };
  } catch (err) {
    console.error('Delete business error:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to delete business',
    };
  }
}
