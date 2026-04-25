import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBusiness extends Document {
  businessName: string;
  /** Max 3 services per business */
  services: string[];
  serviceHours: string;
  businessDescription: string;
  businessType: string;
  serviceAreas: string;
  /**
   * Rich media list (images + videos). Backward-compatible with legacy `images`.
   * Prefer this field for new clients.
   */
  media?: Array<{
    url: string;
    type: 'image' | 'video';
    publicId?: string;
  }>;
  /**
   * Legacy images-only list. Kept for older clients.
   * Should be derived from `media` where possible.
   */
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    businessName: { type: String, required: true },
    services: {
      type: [String],
      required: true,
      validate: {
        validator(v: string[]) {
          const arr = Array.isArray(v) ? v : [];
          return arr.length >= 1 && arr.length <= 3;
        },
        message: 'Business must have 1 to 3 services',
      },
    },
    serviceHours: { type: String, default: '' },
    businessDescription: { type: String, default: '' },
    businessType: { type: String, required: true },
    serviceAreas: { type: String, default: '' },
    media: {
      type: [
        new Schema(
          {
            url: { type: String, required: true },
            type: { type: String, enum: ['image', 'video'], required: true },
            publicId: { type: String, default: '' },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    images: { type: [String], default: [] },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

BusinessSchema.index({ businessType: 1 });
BusinessSchema.index({ services: 1 });

export const Business: Model<IBusiness> =
  (() => {
    const existing = mongoose.models.Business as Model<IBusiness> | undefined;
    if (existing) {
      // In Next.js dev/HMR, Mongoose can keep an older schema in memory.
      // If the cached model doesn't have the new `media` path, recreate it.
      const hasMediaPath = typeof (existing as unknown as { schema?: unknown })?.schema === 'object'
        ? !!(existing as unknown as { schema: { path?: (p: string) => unknown } }).schema.path?.('media')
        : false;

      if (!hasMediaPath) {
        mongoose.deleteModel('Business');
        return mongoose.model<IBusiness>('Business', BusinessSchema);
      }

      return existing;
    }

    return mongoose.model<IBusiness>('Business', BusinessSchema);
  })();
