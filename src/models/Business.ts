import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBusiness extends Document {
  businessName: string;
  services: string;
  serviceHours: string;
  businessDescription: string;
  businessType: string;
  serviceAreas: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    businessName: { type: String, required: true },
    services: { type: String, required: true },
    serviceHours: { type: String, default: '' },
    businessDescription: { type: String, default: '' },
    businessType: { type: String, required: true },
    serviceAreas: { type: String, default: '' },
    images: { type: [String], default: [] },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

BusinessSchema.index({ businessType: 1 });
BusinessSchema.index({ services: 1 });

export const Business: Model<IBusiness> =
  mongoose.models.Business ?? mongoose.model<IBusiness>('Business', BusinessSchema);
