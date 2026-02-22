# ZeeBuddy – Setup Checklist

**Configure these before running the app.** Add your credentials to `.env` (copy from `.env.example`).

---

# 1. Firebase Auth – Required Configuration

## 1.1 Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project (or use existing) → **ZeeBuddy**
3. Enable **Authentication**:
   - **Sign-in method** → **Email/Password** → Enable
   - **Sign-in method** → **Google** → Enable
   - Add **Authorized domains** (e.g. `localhost`, your production domain)

## 1.2 Web App (Admin Panel)

1. Project Overview → **Add app** → **Web** (</>)
2. Register app name → Copy **Firebase config**:
   ```
   apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId
   ```
3. Add to `.env`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

## 1.3 Service Account (Backend – Token Verification)

1. Project Settings (gear) → **Service accounts**
2. **Generate new private key** → Download JSON
3. Add to `.env`:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
   Or use full JSON path:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
   ```

---

# 2. FCM (Firebase Cloud Messaging) – Required Configuration

## 2.1 Enable Cloud Messaging

1. Firebase Console → **Project Settings** → **Cloud Messaging**
2. **Cloud Messaging API (Legacy)** – Enable if using legacy (optional)
3. **FCM HTTP v1** – Uses Service Account (recommended)

## 2.2 Service Account for FCM

- Same Service Account as Auth (step 1.3)
- FCM HTTP v1 uses `firebase-admin` SDK with service account
- No extra config needed if Auth service account is set

## 2.3 React Native (User App) – Later

- Add Android app → `google-services.json`
- Add iOS app → APNs key
- `@react-native-firebase/messaging` – get FCM token on login

---

# 3. Cloudinary – Required Configuration

## 3.1 Create Account

1. Go to [Cloudinary](https://cloudinary.com) → Sign up
2. Dashboard → Copy **Cloud name**, **API Key**, **API Secret**

## 3.2 Add to .env

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 3.3 Upload Presets (Optional)

- **Settings** → **Upload** → **Upload presets**
- Create preset for `unsigned` uploads (client-side) if needed
- Or use **signed** uploads (server-side) – more secure

## 3.4 Folders (Recommended)

- Use folders: `zeebuddy/posts`, `zeebuddy/businesses`, `zeebuddy/avatars`, `zeebuddy/events`
- Set in upload: `folder: "zeebuddy/posts"`

---

# 4. Nodemailer (Gmail SMTP) – Email / OTP

## 4.1 Gmail App Password

1. Google Account → **Security** → Enable **2-Step Verification**
2. **Security** → **App passwords** → Create (Mail, Other)
3. Copy the 16-character password

## 4.2 Add to .env

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=ZeeBuddy <your-email@gmail.com>
```

**Note:** Use App Password, not your normal Gmail password.

---

# 5. MongoDB – Required Configuration

## 5.1 Get Connection String

1. [MongoDB Atlas](https://cloud.mongodb.com) or self-hosted
2. Create cluster → **Connect** → **Drivers** → Copy connection string
3. Format: `mongodb+srv://<user>:<password>@cluster.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority`

## 5.2 Add to .env

```
MONGODB_URI=mongodb+srv://user:password@cluster.xxxxx.mongodb.net/zeebuddy?retryWrites=true&w=majority
```

## 5.3 Database Name

- Use `zeebuddy` as database name (or your choice)

---

# 6. Summary – All .env Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Firebase (Client – Admin Panel)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase (Server – Token Verify + FCM)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Nodemailer (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=ZeeBuddy <your-email@gmail.com>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT (Admin email/password sessions)
JWT_SECRET=your-secret-key-change-in-production
```

---

# 7. Admin User (Email/Password Login)

Create the default admin user for email/password sign-in:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' src/scripts/seed-admin.ts
```

**Default credentials:**
- Email: `zeebuddy@zeebuddy.com`
- Password: `12345678`

---

# 8. Quick Checklist

| Item | Where | Status |
|------|-------|--------|
| Firebase project created | Firebase Console | ☐ |
| Email/Password auth enabled | Auth → Sign-in method | ☐ |
| Google auth enabled | Auth → Sign-in method | ☐ |
| Web app added | Project Settings | ☐ |
| Service account key downloaded | Service accounts | ☐ |
| FCM enabled | Cloud Messaging | ☐ |
| Cloudinary account | cloudinary.com | ☐ |
| MongoDB URI | Atlas / self-hosted | ☐ |
| Gmail App Password | Google Account → Security | ☐ |
| .env filled | Project root | ☐ |
| Admin user seeded | Run seed-admin.ts script | ☐ |
