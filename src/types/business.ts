export type BusinessMediaType = "image" | "video";

export interface BusinessMediaItem {
  url: string;
  type: BusinessMediaType;
  publicId?: string;
}

export interface BusinessEntity {
  id: string;
  businessName: string;
  services: string[];
  serviceHours: string;
  businessDescription: string;
  businessType: string;
  serviceAreas: string;
  media: BusinessMediaItem[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessRequest {
  businessName: string;
  businessType: string;
  services: string[];
  serviceHours?: string;
  businessDescription?: string;
  serviceAreas?: string;
  media?: BusinessMediaItem[];
}

export interface UpdateBusinessRequest {
  businessName?: string;
  businessType?: string;
  services?: string[];
  addServices?: string[];
  removeServices?: string[];
  serviceHours?: string;
  businessDescription?: string;
  serviceAreas?: string;
  media?: BusinessMediaItem[];
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
