'use server';

import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import { Business } from '@/models';
import { uploadToCloudinary } from '@/lib/cloudinary';

export interface BusinessFormData {
  businessName: string;
  services: string;
  serviceHours?: string;
  businessDescription?: string;
  businessType: string;
  serviceAreas?: string;
  images?: File[];
  existingImages?: string[];
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
    services: string;
    serviceHours: string;
    businessDescription: string;
    businessType: string;
    serviceAreas: string;
    images: string[];
    createdAt: Date;
    updatedAt: Date;
  }>;
  message?: string;
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

export async function saveBusinessMongo(formData: FormData): Promise<SaveBusinessResult> {
  try {
    const businessName = formData.get('businessName') as string;
    const services = formData.get('services') as string;
    const serviceHours = (formData.get('serviceHours') as string) || '';
    const businessDescription = (formData.get('businessDescription') as string) || '';
    const businessType = formData.get('businessType') as string;
    const serviceAreas = (formData.get('serviceAreas') as string) || '';

    if (!businessName || !services || !businessType) {
      return { success: false, message: 'Business name, services, and business type are required' };
    }

    const imageFiles: File[] = [];
    for (const entry of formData.getAll('images')) {
      if (entry instanceof File && entry.size > 0) imageFiles.push(entry);
    }

    let imageUrls: string[] = [];
    if (imageFiles.length > 0) {
      imageUrls = await uploadFiles(imageFiles);
    }

    await connectDB();
    const business = await Business.create({
      businessName,
      services,
      serviceHours,
      businessDescription,
      businessType,
      serviceAreas,
      images: imageUrls,
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

    return {
      success: true,
      businesses: businesses.map((b) => ({
        id: String(b._id),
        businessName: b.businessName,
        services: b.services,
        serviceHours: b.serviceHours,
        businessDescription: b.businessDescription,
        businessType: b.businessType,
        serviceAreas: b.serviceAreas,
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
    const services = formData.get('services') as string;
    const serviceHours = (formData.get('serviceHours') as string) || '';
    const businessDescription = (formData.get('businessDescription') as string) || '';
    const businessType = formData.get('businessType') as string;
    const serviceAreas = (formData.get('serviceAreas') as string) || '';

    const existingImagesStr = formData.get('existingImages') as string;
    let imageUrls: string[] = existingImagesStr ? JSON.parse(existingImagesStr) : [];

    const imageFiles: File[] = [];
    for (const entry of formData.getAll('images')) {
      if (entry instanceof File && entry.size > 0) imageFiles.push(entry);
    }
    if (imageFiles.length > 0) {
      const newUrls = await uploadFiles(imageFiles);
      imageUrls = [...imageUrls, ...newUrls];
    }

    if (!businessName || !services || !businessType) {
      return { success: false, message: 'Business name, services, and business type are required' };
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
        images: imageUrls,
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();

    if (!business) return { success: false, message: 'Business not found' };

    revalidatePath('/local-business');
    return {
      success: true,
      message: 'Business updated successfully',
      business: {
        id: String(business._id),
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
