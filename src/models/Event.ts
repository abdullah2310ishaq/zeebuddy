import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IEventMedia {
  url: string;
  type: 'image' | 'video';
  publicId?: string;
}

export interface IEvent extends Document {
  title: string;
  description: string;
  /** Optional: what will happen at the event (agenda / activities). Shown under event for user filtering. */
  whatHappens?: string;
  /** Optional: niche/category for user-side filter (e.g. "fitness", "community", "workshop"). */
  niche?: string;
  date: Date;
  time: string;
  location: string;
  media: IEventMedia[];
  createdBy: Types.ObjectId;
  attendeesCount: number;
  scheduledAt?: Date | null; // Optional: when to publish event publicity
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const EventMediaSchema = new Schema<IEventMedia>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    publicId: { type: String },
  },
  { _id: false }
);

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    whatHappens: { type: String, default: '' },
    niche: { type: String, default: '' },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, default: '' },
    media: { type: [EventMediaSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attendeesCount: { type: Number, default: 0 },
    scheduledAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

EventSchema.index({ date: 1 });
EventSchema.index({ createdBy: 1 });
EventSchema.index({ niche: 1 });

export const Event: Model<IEvent> =
  mongoose.models.Event ?? mongoose.model<IEvent>('Event', EventSchema);
