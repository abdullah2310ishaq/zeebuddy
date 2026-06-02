import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDevicePushToken extends Document {
  installationId: string;
  token: string;
  platform: "ios" | "android";
  environment?: "development" | "production";
  appMode: "guest" | "user";
  userId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DevicePushTokenSchema = new Schema<IDevicePushToken>(
  {
    installationId: { type: String, required: true, index: true },
    token: { type: String, required: true, index: true },
    platform: { type: String, enum: ["ios", "android"], required: true },
    environment: { type: String, enum: ["development", "production"], required: false },
    appMode: { type: String, enum: ["guest", "user"], default: "guest", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

DevicePushTokenSchema.index({ installationId: 1, platform: 1 }, { unique: true });
DevicePushTokenSchema.index({ token: 1, platform: 1 }, { unique: true });

export const DevicePushToken: Model<IDevicePushToken> =
  mongoose.models.DevicePushToken ?? mongoose.model<IDevicePushToken>("DevicePushToken", DevicePushTokenSchema);
