import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationSettings {
  postApprovalRejection?: boolean; // notify when my post is approved/rejected
  adminPush?: boolean; // receive admin-sent push notifications
  eventReminders?: boolean; // reminders for events I'm going to
}

/** Per-device registration; Android uses FCM token, iOS uses APNs device token. */
export interface IUserPushToken {
  platform: 'ios' | 'android';
  token: string;
  /** iOS only; omit or `production` for TestFlight / App Store. */
  environment?: 'development' | 'production';
}

export interface IUser extends Document {
  email: string;
  phone?: string;
  passwordHash?: string;
  firebaseUid?: string;
  role: 'user' | 'admin';
  name: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  /** Legacy Android FCM field; still set when Android registers via fcm-token. */
  fcmToken?: string;
  /** Multi-platform device tokens (iOS APNs + Android FCM). */
  pushTokens?: IUserPushToken[];
  notificationSettings?: INotificationSettings;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    passwordHash: { type: String },
    firebaseUid: { type: String, sparse: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    name: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    avatarUrl: { type: String },
    fcmToken: { type: String },
    pushTokens: [
      {
        platform: { type: String, enum: ['ios', 'android'], required: true },
        token: { type: String, required: true },
        environment: { type: String, enum: ['development', 'production'], required: false },
      },
    ],
    notificationSettings: {
      postApprovalRejection: { type: Boolean, default: true },
      adminPush: { type: Boolean, default: true },
      eventReminders: { type: Boolean, default: true },
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ firebaseUid: 1 }, { sparse: true });
UserSchema.index({ fcmToken: 1 });

export const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
