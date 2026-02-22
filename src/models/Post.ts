import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IMedia {
  url: string;
  type: 'image' | 'video';
  publicId?: string;
}

export interface IPost extends Document {
  title: string;
  content: string;
  media: IMedia[];
  postType: 'image' | 'video' | 'text';
  categoryId: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'published' | 'scheduled';
  authorId: Types.ObjectId;
  authorType: 'user' | 'admin';
  expiryAt?: Date | null;
  scheduledAt?: Date | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const MediaSchema = new Schema<IMedia>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    publicId: { type: String },
  },
  { _id: false }
);

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    content: { type: String, default: '' },
    media: { type: [MediaSchema], default: [] },
    postType: { type: String, enum: ['image', 'video', 'text'], required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'published', 'scheduled'],
      default: 'pending',
    },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorType: { type: String, enum: ['user', 'admin'], required: true },
    expiryAt: { type: Date, default: null },
    scheduledAt: { type: Date, default: null },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PostSchema.index({ status: 1 });
PostSchema.index({ authorId: 1 });
PostSchema.index({ categoryId: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ expiryAt: 1 });
PostSchema.index({ deletedAt: 1 });

export const Post: Model<IPost> = mongoose.models.Post ?? mongoose.model<IPost>('Post', PostSchema);
