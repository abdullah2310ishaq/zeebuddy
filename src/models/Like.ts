import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ILike extends Document {
  targetType: 'post' | 'comment';
  targetId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    targetType: { type: String, enum: ['post', 'comment'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

LikeSchema.index({ targetType: 1, targetId: 1, userId: 1 }, { unique: true });

export const Like: Model<ILike> = mongoose.models.Like ?? mongoose.model<ILike>('Like', LikeSchema);
