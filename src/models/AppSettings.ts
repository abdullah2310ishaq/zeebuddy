import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAppSettings extends Document {
  key: string;
  value: unknown;
  updatedAt: Date;
}

const AppSettingsSchema = new Schema<IAppSettings>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

AppSettingsSchema.index({ key: 1 }, { unique: true });

export const AppSettings: Model<IAppSettings> =
  mongoose.models.AppSettings ?? mongoose.model<IAppSettings>('AppSettings', AppSettingsSchema);

/** Default: post notifications enabled for users */
export const POST_NOTIFICATIONS_KEY = 'postNotificationsEnabled';
