import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { DevicePushToken } from "@/models";
import { requireAuth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";

type Platform = "ios" | "android";

function parsePlatform(value: unknown): Platform | null {
  return value === "ios" || value === "android" ? value : null;
}

/**
 * POST /api/v1/push/device-token
 * Register guest/user device token on app initialize.
 * Body: { installationId, token|fcmToken, platform, environment?, appMode? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const installationId =
      typeof body?.installationId === "string" ? body.installationId.trim() : "";
    const token =
      typeof body?.token === "string"
        ? body.token.trim()
        : typeof body?.fcmToken === "string"
          ? body.fcmToken.trim()
          : "";
    const platform = parsePlatform(body?.platform);
    const environment =
      body?.environment === "development" || body?.environment === "production"
        ? body.environment
        : undefined;
    const appMode = body?.appMode === "user" ? "user" : "guest";

    if (!installationId) {
      return apiError("installationId is required", "VALIDATION_ERROR", 400);
    }
    if (!token) {
      return apiError("token or fcmToken is required", "VALIDATION_ERROR", 400);
    }
    if (!platform) {
      return apiError("platform must be ios or android", "VALIDATION_ERROR", 400);
    }

    await connectDB();

    const authUser = await requireAuth(request.headers.get("Authorization"));
    const userId = appMode === "user" && authUser ? new mongoose.Types.ObjectId(String(authUser._id)) : undefined;

    await DevicePushToken.findOneAndUpdate(
      { installationId, platform },
      {
        $set: {
          token,
          platform,
          environment: platform === "ios" ? environment : undefined,
          appMode,
          isActive: true,
          ...(userId ? { userId } : {}),
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return apiSuccess(
      { installationId, platform, appMode },
      appMode === "guest" ? "Guest push token registered" : "User device token registered"
    );
  } catch (err) {
    console.error("Device token registration error:", err);
    return apiError("Failed to register device token", "SERVER_ERROR", 500);
  }
}

/**
 * DELETE /api/v1/push/device-token
 * Disable token for a device (e.g. on logout/opt-out).
 * Body: { installationId, platform }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const installationId =
      typeof body?.installationId === "string" ? body.installationId.trim() : "";
    const platform = parsePlatform(body?.platform);

    if (!installationId || !platform) {
      return apiError("installationId and platform are required", "VALIDATION_ERROR", 400);
    }

    await connectDB();
    await DevicePushToken.findOneAndUpdate(
      { installationId, platform },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    return apiSuccess({ installationId, platform }, "Device token disabled");
  } catch (err) {
    console.error("Device token disable error:", err);
    return apiError("Failed to disable device token", "SERVER_ERROR", 500);
  }
}
