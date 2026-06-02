import type {
  BusinessMediaItem,
  CreateBusinessRequest,
  UpdateBusinessRequest,
} from "@/types/business";

const MAX_SERVICES = 3;

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function normalizeServices(value: unknown): string[] {
  if (!Array.isArray(value)) {
    if (typeof value === "string" && value.trim()) {
      return [value.trim().toLowerCase()];
    }
    return [];
  }

  return unique(
    value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

function parseMedia(value: unknown): BusinessMediaItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      url: cleanString(item.url),
      type: item.type === "video" ? ("video" as const) : ("image" as const),
      publicId: cleanString(item.publicId) || undefined,
    }))
    .filter((item) => item.url.length > 0);
}

export function parseCreateBusinessPayload(payload: unknown): ValidationResult<CreateBusinessRequest> {
  if (!payload || typeof payload !== "object") {
    return { success: false, error: "Invalid request payload", code: "VALIDATION_ERROR" };
  }

  const body = payload as Record<string, unknown>;
  const businessName = cleanString(body.businessName);
  const businessType = cleanString(body.businessType);
  const services = normalizeServices(body.services);

  if (!businessName) {
    return { success: false, error: "Business name is required", code: "VALIDATION_ERROR" };
  }
  if (!businessType) {
    return { success: false, error: "Business type is required", code: "VALIDATION_ERROR" };
  }
  if (services.length === 0) {
    return { success: false, error: "At least one service is required", code: "VALIDATION_ERROR" };
  }
  if (services.length > MAX_SERVICES) {
    return {
      success: false,
      error: "Maximum 3 services allowed per business",
      code: "SERVICE_LIMIT_EXCEEDED",
    };
  }

  return {
    success: true,
    data: {
      businessName,
      businessType,
      services,
      serviceHours: cleanString(body.serviceHours),
      businessDescription: cleanString(body.businessDescription),
      serviceAreas: cleanString(body.serviceAreas),
      media: parseMedia(body.media),
    },
  };
}

export function parseUpdateBusinessPayload(payload: unknown): ValidationResult<UpdateBusinessRequest> {
  if (!payload || typeof payload !== "object") {
    return { success: false, error: "Invalid request payload", code: "VALIDATION_ERROR" };
  }

  const body = payload as Record<string, unknown>;
  const parsed: UpdateBusinessRequest = {};

  if (body.businessName !== undefined) {
    const businessName = cleanString(body.businessName);
    if (!businessName) {
      return { success: false, error: "Business name cannot be empty", code: "VALIDATION_ERROR" };
    }
    parsed.businessName = businessName;
  }

  if (body.businessType !== undefined) {
    const businessType = cleanString(body.businessType);
    if (!businessType) {
      return { success: false, error: "Business type cannot be empty", code: "VALIDATION_ERROR" };
    }
    parsed.businessType = businessType;
  }

  if (body.services !== undefined) {
    const services = normalizeServices(body.services);
    if (services.length === 0) {
      return { success: false, error: "At least one service is required", code: "VALIDATION_ERROR" };
    }
    if (services.length > MAX_SERVICES) {
      return {
        success: false,
        error: "Maximum 3 services allowed per business",
        code: "SERVICE_LIMIT_EXCEEDED",
      };
    }
    parsed.services = services;
  }

  if (body.addServices !== undefined) {
    parsed.addServices = normalizeServices(body.addServices);
  }
  if (body.removeServices !== undefined) {
    parsed.removeServices = normalizeServices(body.removeServices);
  }

  if (body.serviceHours !== undefined) parsed.serviceHours = cleanString(body.serviceHours);
  if (body.businessDescription !== undefined) parsed.businessDescription = cleanString(body.businessDescription);
  if (body.serviceAreas !== undefined) parsed.serviceAreas = cleanString(body.serviceAreas);
  if (body.media !== undefined) parsed.media = parseMedia(body.media);

  const updateTouchesServices =
    parsed.services !== undefined ||
    (parsed.addServices !== undefined && parsed.addServices.length > 0) ||
    (parsed.removeServices !== undefined && parsed.removeServices.length > 0);

  if (
    updateTouchesServices &&
    parsed.services === undefined &&
    parsed.addServices !== undefined &&
    parsed.removeServices !== undefined &&
    parsed.addServices.length === 0 &&
    parsed.removeServices.length === 0
  ) {
    return { success: false, error: "No service changes provided", code: "VALIDATION_ERROR" };
  }

  return { success: true, data: parsed };
}

export function mergeServiceMutations(
  currentServices: string[],
  update: UpdateBusinessRequest
): ValidationResult<string[]> {
  if (update.services) {
    if (update.services.length === 0 || update.services.length > MAX_SERVICES) {
      return {
        success: false,
        error: "Services must contain 1 to 3 values",
        code: "VALIDATION_ERROR",
      };
    }
    return { success: true, data: update.services };
  }

  const next = new Set(currentServices.map((service) => service.trim().toLowerCase()).filter(Boolean));

  for (const service of update.removeServices ?? []) {
    next.delete(service);
  }

  for (const service of update.addServices ?? []) {
    next.add(service);
  }

  const merged = Array.from(next);
  if (merged.length === 0) {
    return { success: false, error: "At least one service is required", code: "VALIDATION_ERROR" };
  }
  if (merged.length > MAX_SERVICES) {
    return {
      success: false,
      error: "Maximum 3 services allowed per business",
      code: "SERVICE_LIMIT_EXCEEDED",
    };
  }

  return { success: true, data: merged };
}

export function mediaToLegacyImages(media: BusinessMediaItem[]): string[] {
  return unique(media.filter((item) => item.type === "image").map((item) => item.url));
}
