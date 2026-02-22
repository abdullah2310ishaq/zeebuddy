'use server';

import { utapi } from '@/lib/uploadthing';
import { revalidatePath } from 'next/cache';
import { getPrismaClient } from '@/lib/client';

export interface SaveBusinessFormResult {
  success: boolean;
  message: string;
  businessId?: string;
}

export interface Business {
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
}

export interface GetBusinessesResult {
  success: boolean;
  businesses?: Business[];
  message?: string;
}

export interface UpdateBusinessResult {
  success: boolean;
  message: string;
  business?: Business;
}

export interface DeleteBusinessResult {
  success: boolean;
  message: string;
}

/**
 * Saves a business form with image uploads to UploadThing
 * Images are uploaded to the bucket when the form is submitted
 */
export async function saveBusinessForm(
  formData: FormData
): Promise<SaveBusinessFormResult> {
  const prisma = await getPrismaClient();
  
  try {
    // Extract form data
    const businessName = formData.get('businessName') as string;
    const services = formData.get('services') as string;
    const serviceHours = formData.get('serviceHours') as string;
    const businessDescription = formData.get('businessDescription') as string;
    const businessType = formData.get('businessType') as string;
    const serviceAreas = formData.get('serviceAreas') as string;
    
    // Extract image files
    const imageFiles: File[] = [];
    const imageEntries = formData.getAll('images');
    
    for (const entry of imageEntries) {
      if (entry instanceof File && entry.size > 0) {
        imageFiles.push(entry);
      }
    }

    // Validate required fields
    if (!businessName || !services || !businessType) {
      return {
        success: false,
        message: 'Business name, services, and business type are required',
      };
    }

    // Upload images to UploadThing
    let imageUrls: string[] = [];
    
    if (imageFiles.length > 0) {
      try {
        console.log('Uploading', imageFiles.length, 'image(s) to UploadThing...');
        const uploadResults = await utapi.uploadFiles(imageFiles);
        console.log('Upload results:', JSON.stringify(uploadResults, null, 2));
        
        // Extract URLs from upload results
        // Results have a nested structure: { data: { ufsUrl, url, ... }, error: null }
        imageUrls = uploadResults
          .map((result, index) => {
            if (!result) {
              console.warn(`Upload result ${index} is null or undefined`);
              return null;
            }
            
            // Check for errors first
            if (result.error) {
              console.error(`Upload error at index ${index}:`, result.error);
              return null;
            }
            
            // Access nested data property
            const fileData = result.data;
            if (!fileData) {
              console.warn(`Upload result ${index} has no data property`);
              return null;
            }
            
            // Use url (utfs.io) as primary - more reliable and publicly accessible
            // ufsUrl is the new API but url is still the standard public URL
            if ('url' in fileData && fileData.url && typeof fileData.url === 'string') {
              return fileData.url.trim();
            }
            // Fallback to ufsUrl if url is not available
            if ('ufsUrl' in fileData && fileData.ufsUrl && typeof fileData.ufsUrl === 'string') {
              return fileData.ufsUrl.trim();
            }
            // Log for debugging
            console.warn(`Unexpected upload result structure at index ${index}:`, result);
            return null;
          })
          .filter((url): url is string => url !== null);
        
        console.log('Extracted image URLs:', imageUrls);
        console.log('URL lengths:', imageUrls.map(url => url.length));
        
        if (imageUrls.length === 0) {
          console.error('No valid URLs extracted from upload results:', uploadResults);
          return {
            success: false,
            message: 'Failed to upload images - no URLs returned from upload service',
          };
        }
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return {
          success: false,
          message: `Error uploading images to storage: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`,
        };
      }
    }

    // Log URLs before saving to database
    console.log('Saving business with image URLs:', imageUrls);
    console.log('Image URLs to be saved:', JSON.stringify(imageUrls, null, 2));

    // Save business to database
    const business = await prisma.business.create({
      data: {
        businessName,
        services,
        serviceHours: serviceHours || '',
        businessDescription: businessDescription || '',
        businessType,
        serviceAreas: serviceAreas || '',
        images: imageUrls,
      },
    });
    
    console.log('Business saved with ID:', business.id);
    console.log('Saved images in database:', business.images);

    // Revalidate the local business page
    revalidatePath('/local-business');

    return {
      success: true,
      message: 'Business saved successfully',
      businessId: business.id,
    };
  } catch (error) {
    console.error('Error saving business form:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while saving the business',
    };
  }
}

/**
 * Fetches all businesses from the database
 */
export async function getBusinesses(): Promise<GetBusinessesResult> {
  const prisma = await getPrismaClient();
  
  try {
    const businesses = await prisma.business.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      businesses: businesses.map((b) => ({
        id: b.id,
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
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching businesses',
    };
  }
}

/**
 * Updates a business by ID
 */
export async function updateBusiness(
  businessId: string,
  formData: FormData
): Promise<UpdateBusinessResult> {
  const prisma = await getPrismaClient();
  
  try {
    // Extract form data
    const businessName = formData.get('businessName') as string;
    const services = formData.get('services') as string;
    const serviceHours = formData.get('serviceHours') as string;
    const businessDescription = formData.get('businessDescription') as string;
    const businessType = formData.get('businessType') as string;
    const serviceAreas = formData.get('serviceAreas') as string;
    
    // Extract image files (new uploads)
    const imageFiles: File[] = [];
    const imageEntries = formData.getAll('images');
    
    for (const entry of imageEntries) {
      if (entry instanceof File && entry.size > 0) {
        imageFiles.push(entry);
      }
    }

    // Get existing images (if any)
    const existingImages = formData.get('existingImages') as string;
    let imageUrls: string[] = [];
    
    if (existingImages) {
      try {
        imageUrls = JSON.parse(existingImages);
      } catch {
        imageUrls = [];
      }
    }

    // Upload new images if any
    if (imageFiles.length > 0) {
      try {
        const uploadResults = await utapi.uploadFiles(imageFiles);
        
        const newImageUrls = uploadResults
          .map((result) => {
            if (!result || result.error) return null;
            const fileData = result.data;
            if (!fileData) return null;
            
            if ('url' in fileData && fileData.url && typeof fileData.url === 'string') {
              return fileData.url.trim();
            }
            if ('ufsUrl' in fileData && fileData.ufsUrl && typeof fileData.ufsUrl === 'string') {
              return fileData.ufsUrl.trim();
            }
            return null;
          })
          .filter((url): url is string => url !== null);
        
        imageUrls = [...imageUrls, ...newImageUrls];
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return {
          success: false,
          message: 'Error uploading new images',
        };
      }
    }

    // Validate required fields
    if (!businessName || !services || !businessType) {
      return {
        success: false,
        message: 'Business name, services, and business type are required',
      };
    }

    // Update business
    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        businessName,
        services,
        serviceHours: serviceHours || '',
        businessDescription: businessDescription || '',
        businessType,
        serviceAreas: serviceAreas || '',
        images: imageUrls,
      },
    });

    revalidatePath('/local-business');

    return {
      success: true,
      message: 'Business updated successfully',
      business: {
        id: business.id,
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
  } catch (error) {
    console.error('Error updating business:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while updating the business',
    };
  }
}

/**
 * Deletes a business by ID
 */
export async function deleteBusiness(businessId: string): Promise<DeleteBusinessResult> {
  const prisma = await getPrismaClient();
  
  try {
    await prisma.business.delete({
      where: { id: businessId },
    });

    revalidatePath('/local-business');

    return {
      success: true,
      message: 'Business deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting business:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while deleting the business',
    };
  }
}

