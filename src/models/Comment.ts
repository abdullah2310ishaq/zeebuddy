import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IComment extends Document {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  parentId?: Types.ObjectId | null;
  content: string;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const CommentSchema = new Schema<IComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    content: { type: String, required: true },
    likesCount: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

CommentSchema.index({ postId: 1 });
CommentSchema.index({ parentId: 1 });
CommentSchema.index({ userId: 1 });

export const Comment: Model<IComment> =
  mongoose.models.Comment ?? mongoose.model<IComment>('Comment', CommentSchema);
