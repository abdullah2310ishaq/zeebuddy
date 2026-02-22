import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IEventBooking extends Document {
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'going' | 'interested';
  createdAt: Date;
}

const EventBookingSchema = new Schema<IEventBooking>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['going', 'interested'], default: 'going' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

EventBookingSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const EventBooking: Model<IEventBooking> =
  mongoose.models.EventBooking ?? mongoose.model<IEventBooking>('EventBooking', EventBookingSchema);
