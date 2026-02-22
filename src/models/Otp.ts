import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  purpose: 'verification' | 'reset' | 'signin';
  expiresAt: Date;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true, lowercase: true },
    otp: { type: String, required: true },
    purpose: { type: String, enum: ['verification', 'reset', 'signin'], required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

OtpSchema.index({ email: 1, purpose: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp: Model<IOtp> = mongoose.models.Otp ?? mongoose.model<IOtp>('Otp', OtpSchema);
