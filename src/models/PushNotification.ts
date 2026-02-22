import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPushNotification extends Document {
  title: string;
  body: string;
  status: 'draft' | 'sent' | 'pending';
  targetAudience: 'all' | 'segment';
  sentAt?: Date | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PushNotificationSchema = new Schema<IPushNotification>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    status: { type: String, enum: ['draft', 'sent', 'pending'], default: 'draft' },
    targetAudience: { type: String, enum: ['all', 'segment'], default: 'all' },
    sentAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const PushNotification: Model<IPushNotification> =
  mongoose.models.PushNotification ??
  mongoose.model<IPushNotification>('PushNotification', PushNotificationSchema);
