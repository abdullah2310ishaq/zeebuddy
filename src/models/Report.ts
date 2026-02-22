import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReport extends Document {
  targetType: 'post' | 'comment' | 'user';
  targetId: Types.ObjectId;
  reportedBy: Types.ObjectId;
  reportType: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    targetType: { type: String, enum: ['post', 'comment', 'user'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportType: { type: String, required: true },
    reason: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
  },
  { timestamps: true }
);

export const Report: Model<IReport> =
  mongoose.models.Report ?? mongoose.model<IReport>('Report', ReportSchema);
