import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { apiError, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { cloudinary, type CloudinaryFolder } from "@/lib/cloudinary";

type UploadResourceType = "image" | "video";

const MAX_VIDEO_DURATION_SEC = 120;
const VALID_FOLDERS: CloudinaryFolder[] = ["posts", "businesses", "avatars", "events"];

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * POST /api/v1/upload/signature
 * Returns signed Cloudinary upload parameters for browser direct uploads.
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request.headers.get("Authorization"));
  if (!admin) return apiUnauthorized("Authentication required");

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return apiError("Cloudinary not configured", "CONFIG_ERROR", 500);
  }

  try {
    const body: unknown = await request.json().catch(() => null);
    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const folder = cleanString(record.folder) as CloudinaryFolder;
    const resourceType = cleanString(record.type || record.resourceType) as UploadResourceType;

    if (!VALID_FOLDERS.includes(folder)) {
      return apiError("Invalid folder. Must be: posts, businesses, avatars, events", "VALIDATION_ERROR", 400);
    }

    if (resourceType !== "image" && resourceType !== "video") {
      return apiError("Invalid type. Must be: image or video", "VALIDATION_ERROR", 400);
    }

    if (folder === "avatars" && resourceType !== "image") {
      return apiError("Avatar uploads must be images only", "VALIDATION_ERROR", 400);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const fullFolder = `zeebuddy/${folder}`;
    const signature = cloudinary.utils.api_sign_request(
      {
        folder: fullFolder,
        timestamp,
      },
      apiSecret
    );

    return apiSuccess({
      cloudName,
      apiKey,
      folder: fullFolder,
      resourceType,
      timestamp,
      signature,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      maxVideoDurationSec: MAX_VIDEO_DURATION_SEC,
    });
  } catch (err) {
    console.error("[Upload Signature] Error:", err);
    return apiError("Failed to create upload signature", "SERVER_ERROR", 500);
  }
}
