import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBusinessBooking extends Document {
  businessId: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessBookingSchema = new Schema<IBusinessBooking>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

BusinessBookingSchema.index({ businessId: 1, userId: 1 });

export const BusinessBooking: Model<IBusinessBooking> =
  mongoose.models.BusinessBooking ?? mongoose.model<IBusinessBooking>('BusinessBooking', BusinessBookingSchema);
