# ZeeBuddy – Final API & Implementation Reference

**Single source of truth for building ZeeBuddy APIs.** Use this document when implementing backend APIs, MongoDB schemas, and integrating Firebase/FCM.

---

# 1. Tech Stack

| Component | Technology |
|-----------|------------|
| **User App** | React Native |
| **Admin Panel** | Next.js (App Router) — *current focus* |
| **Database** | MongoDB |
| **Auth** | Firebase Auth (Email/Password, Google Sign-In, OTP) |
| **Push Notifications** | FCM (Firebase Cloud Messaging) |
| **File Storage** | Cloudinary (images & videos) |
| **API Docs** | Swagger / OpenAPI 3.x |

---

# 2. Current Project State (Admin Panel)

## 2.1 What Exists

| Route | Status | Notes |
|-------|--------|-------|
| `/dashboard` | **Working** | Stats, top contributors — real data |
| `/content-management` | **Working** | News/Events, create, edit, delete — real data |
| `/content-management/all` | **Working** | See all news & events |
| `/content-management/news/[id]` | **Working** | News detail & edit |
| `/content-management/events/[id]` | **Working** | Event detail & edit |
| `/create-project` | **Working** | Create news or event (full page) |
| `/local-business` | **Working** | List, add, edit, delete — MongoDB + Cloudinary |
| `/local-business/[id]` | **Working** | Business detail page |
| `/user-generated` | **Working** | Approve/decline — real data |
| `/push-notification` | **Working** | Compose, history — FCM backend |
| `/settings` | **Working** | Profile, account (email/Google) |
| `/auth/sign-in` | **Working** | Admin login (email/password + Google) |

## 2.2 All APIs (Built vs To Build)

**Legend:** ✅ = Implemented | 🔲 = Not yet built

### User App APIs (for React Native)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/v1/auth/sign-up` | POST | ✅ (sends OTP only) |
| `/api/v1/auth/confirm-sign-up` | POST | ✅ (OTP + create account) |
| `/api/v1/auth/sign-in` | POST | ✅ (returns user + token) |
| `/api/v1/auth/google` | POST | ✅ (returns user + token) |
| `/api/v1/auth/forgot-password` | POST | ✅ |
| `/api/v1/auth/verify-otp` | POST | ✅ |
| `/api/v1/auth/reset-password` | POST | ✅ |
| `/api/v1/auth/refresh` | POST | ✅ (accepts user JWT or Firebase token) |
| `/api/v1/user/fcm-token` | POST | ✅ |
| `/api/v1/user/profile` | GET, PATCH | ✅ |
| `/api/v1/user/change-password` | PATCH | ✅ |
| `/api/v1/user/settings` | GET, PATCH | ✅ (notification preferences) |
| `/api/v1/news` | GET | ✅ |
| `/api/v1/news/:id` | GET | ✅ |
| `/api/v1/categories` | GET | ✅ (use for news categories) |
| `/api/v1/events` | GET | ✅ |
| `/api/v1/events/:id` | GET | ✅ |
| `/api/v1/events/:id/going` | POST, DELETE | ✅ |
| `/api/v1/business` | GET | ✅ |
| `/api/v1/business/:id` | GET | ✅ |
| `/api/v1/business/:id/booking` | POST | ✅ |
| `/api/v1/posts` | POST | ✅ |
| `/api/v1/posts/:id/like` | POST, DELETE | ✅ |
| `/api/v1/posts/:id/share` | POST | ✅ |
| `/api/v1/posts/:id/comments` | GET, POST | ✅ |
| `/api/v1/comments/:id/reply` | POST | ✅ |
| `/api/v1/comments/:id/like` | POST | ✅ |
| `/api/v1/reports` | POST | ✅ |
| `/api/v1/reports/types` | GET | ✅ |

### Admin Panel APIs

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/v1/auth/admin/sign-in` | POST | ✅ |
| `/api/v1/auth/admin/google` | POST | ✅ |
| `/api/v1/auth/admin/me` | GET | ✅ |
| `/api/v1/admin/dashboard/stats` | GET | ✅ |
| `/api/v1/admin/dashboard/top-contributors` | GET | ✅ |
| `/api/v1/admin/content/posts` | GET, POST | ✅ |
| `/api/v1/admin/content/posts/:id` | GET, PUT, DELETE | ✅ |
| `/api/v1/admin/content/events` | GET, POST | ✅ |
| `/api/v1/admin/content/events/:id` | GET, PUT, DELETE | ✅ |
| `/api/v1/admin/user-generated/metrics` | GET | ✅ |
| `/api/v1/admin/user-generated/pending` | GET | ✅ |
| `/api/v1/admin/user-generated/:id/approve` | POST | ✅ |
| `/api/v1/admin/user-generated/:id/decline` | POST | ✅ |
| `/api/v1/admin/push-notifications` | GET, POST | ✅ |
| `/api/v1/business` | GET, POST | ✅ |
| `/api/v1/business/:id` | GET, PUT, DELETE | ✅ |
| `/api/v1/categories` | GET, POST | ✅ |
| `/api/v1/upload` | POST | ✅ Cloudinary |

## 2.3 Migration Status

- **Database**: MongoDB + Mongoose ✅
- **Storage**: Cloudinary (images & videos) ✅
- **Auth**: Firebase Auth (Google) + JWT ✅
- **Business**: MongoDB + Cloudinary ✅
- **Content**: Posts & Events (admin CRUD) ✅

---

# 3. User Flow (Complete)

## 3.1 Auth

| Feature | Description |
|---------|-------------|
| Register | Email & password |
| Login | Email/password or Google Sign-In |
| Forgot password | Request OTP |
| Reset password | Verify OTP, set new password |
| Profile | View and edit (name, password, etc.) |

## 3.2 Posts / News

| Feature | Description |
|---------|-------------|
| Create post | Text, photo, video; description, post type, category, optional expiry time |
| Status | **Pending** until admin approves |
| Admin actions | Accept or reject |
| Feed | Shows only **approved** posts |
| Engagement | Like, comment, reply (nested) |
| Posts section | Current and expired posts |

## 3.3 Events

| Feature | Description |
|---------|-------------|
| Event details | Title, description, date, time, location |
| Booking | Users can book events |
| Attendees | Shows number of attendees and user interest |
| Visibility | Optional: users can see who else booked |

## 3.4 Business

| Feature | Description |
|---------|-------------|
| Profile | Detailed business profile page |
| Action | "Visit" / "See" button |

## 3.5 Profile / Activity

| Feature | Description |
|---------|-------------|
| User profile | Shows user's posts, news, activity |
| Notifications | Notifications section |
| Edit profile | Update name, avatar, etc. |
| Change password | Update password |

---

# 4. MongoDB Schemas

## 4.1 User / Profile

```javascript
{
  _id: ObjectId,
  email: String,           // unique, required
  phone: String,           // optional
  passwordHash: String,    // for email/password auth
  firebaseUid: String,     // for Google-linked users
  role: "user" | "admin",
  name: String,
  firstName: String,   // optional, for email/password sign-up
  lastName: String,    // optional, for email/password sign-up
  avatarUrl: String,
  fcmToken: String,        // for push notifications
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null   // soft delete
}
// Indexes: email (unique), firebaseUid (unique), fcmToken
```

## 4.2 Post / News (unified)

```javascript
{
  _id: ObjectId,
  title: String,
  content: String,
  media: [{ url: String, type: "image" | "video" }],
  postType: "image" | "video" | "text",
  categoryId: ObjectId,    // ref Category
  status: "pending" | "approved" | "rejected" | "published" | "scheduled",
  authorId: ObjectId,     // ref User (user or admin)
  authorType: "user" | "admin",
  expiryAt: Date | null,   // optional expiry
  scheduledAt: Date | null,
  likesCount: Number,
  commentsCount: Number,
  sharesCount: Number,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
// Indexes: status, authorId, categoryId, createdAt, expiryAt
```

## 4.3 Category

```javascript
{
  _id: ObjectId,
  name: String,
  slug: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 4.4 Comment

```javascript
{
  _id: ObjectId,
  postId: ObjectId,
  userId: ObjectId,
  parentId: ObjectId | null,  // null = top-level, else = reply
  content: String,
  likesCount: Number,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
// Indexes: postId, parentId, userId
```

## 4.5 Like (Post or Comment)

```javascript
{
  _id: ObjectId,
  targetType: "post" | "comment",
  targetId: ObjectId,
  userId: ObjectId,
  createdAt: Date
}
// Index: (targetType, targetId, userId) unique
```

## 4.6 Event

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  date: Date,
  time: String,
  location: String,
  media: [{ url: String, type: "image" | "video", publicId?: String }],
  createdBy: ObjectId,     // admin
  attendeesCount: Number,
  scheduledAt: Date | null,  // optional: when to publish event publicity
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
// Indexes: date, createdBy
```

## 4.7 Event Booking

```javascript
{
  _id: ObjectId,
  eventId: ObjectId,
  userId: ObjectId,
  status: "going" | "interested",
  createdAt: Date
}
// Index: (eventId, userId) unique
```

## 4.8 Business

```javascript
{
  _id: ObjectId,
  businessName: String,
  services: String,       // care, food, bath, groom
  serviceHours: String,
  businessDescription: String,
  businessType: String,    // Restaurant, Retail, Service
  serviceAreas: String,
  images: [String],        // URLs from UploadThing
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
// Indexes: businessType, services
```

## 4.9 Push Notification (FCM)

```javascript
{
  _id: ObjectId,
  title: String,
  body: String,
  status: "draft" | "sent" | "pending",
  targetAudience: "all" | "segment",
  sentAt: Date | null,
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId      // admin
}
```

## 4.10 Report

```javascript
{
  _id: ObjectId,
  targetType: "post" | "comment" | "user",
  targetId: ObjectId,
  reportedBy: ObjectId,
  reportType: String,      // ref ReportType
  reason: String,
  status: "pending" | "resolved" | "dismissed",
  createdAt: Date,
  updatedAt: Date
}
```

---

# 5. API Reference (Complete)

## 5.1 Response Format

All APIs return:

```json
// Success
{ "success": true, "data": {...}, "message": "..." }

// Error
{ "success": false, "error": "...", "code": "ERROR_CODE" }
```

## 5.2 User App APIs

**Total: 32 APIs** (for React Native user app) — **All implemented** ✅

| Category | Count | Status |
|----------|-------|--------|
| Auth | 7 | ✅ All built |
| FCM Token | 1 | ✅ Built |
| Profile & Settings | 5 | ✅ All built |
| News (Feed) | 2 | ✅ Built |
| Categories | 1 | ✅ Built |
| Posts (Create, Like, Comment) | 8 | ✅ All built |
| Events | 4 | ✅ All built |
| Businesses | 4 | ✅ All built |
| Reports | 2 | ✅ All built |
| Upload | 1 | ✅ Built (Cloudinary) |

---

### Auth

| API | Method | Auth | Request Body | Notes |
|-----|--------|------|--------------|-------|
| `/api/v1/auth/sign-up` | POST | No | `{ email, firstName, lastName, password }` | Step 1: If email exists → `EMAIL_EXISTS`. Else sends 6-digit OTP to email (purpose `verification`). Account created only after confirm-sign-up. |
| `/api/v1/auth/confirm-sign-up` | POST | No | `{ email, otp, password, firstName, lastName }` | Step 2: Verifies OTP (verification), creates user, returns `{ user, token }`. |
| `/api/v1/auth/sign-in` | POST | No | `{ email, password }` | Returns `{ user, token }`. Returns `USE_GOOGLE` if account uses Google. |
| `/api/v1/auth/google` | POST | No | `{ idToken }` | Firebase ID token. Creates user if not exists. Returns `{ user, token }`. |
| `/api/v1/auth/forgot-password` | POST | No | `{ email }` | Sends 6-digit OTP email (expires 10 min, purpose `reset`). |
| `/api/v1/auth/verify-otp` | POST | No | `{ email, otp, purpose? }` | `purpose`: `reset` \| `verification` \| `signin`. For `verification`, OTP is not consumed here (confirm-sign-up consumes it). |
| `/api/v1/auth/reset-password` | POST | No | `{ email, otp, newPassword }` | Requires valid OTP (purpose `reset`). |
| `/api/v1/auth/refresh` | POST | Bearer | — | Validates user JWT or Firebase token, returns fresh user. |

### FCM Token

| API | Method | Auth | Request Body | Notes |
|-----|--------|------|--------------|-------|
| `/api/v1/user/fcm-token` | POST | Bearer | `{ fcmToken }` | Register/update device token for push. |

### Profile & Settings

| API | Method | Auth | Request Body | Notes |
|-----|--------|------|--------------|-------|
| `/api/v1/user/profile` | GET | Bearer | — | Returns profile (excludes passwordHash, firebaseUid). Includes avatarUrl. |
| `/api/v1/user/profile` | PATCH | Bearer | `{ name?, phone?, avatarUrl? }` | Only these fields. `name` required if sent. |
| `/api/v1/user/profile/avatar` | POST | Bearer | FormData: `file` (image) | Upload avatar image (JPEG/PNG/GIF/WebP, max 5MB). Sets user avatarUrl, returns updated profile. |
| `/api/v1/user/change-password` | PATCH | Bearer | `{ currentPassword, newPassword }` | Email/password only. Returns `USE_GOOGLE` for Google accounts. |
| `/api/v1/user/settings` | GET | Bearer | — | Returns `notificationSettings`: postApprovalRejection, adminPush, eventReminders. |
| `/api/v1/user/settings` | PATCH | Bearer | `{ notificationSettings? }` | Update notification preferences. |

### News (Feed)

| API | Method | Auth | Query Params | Notes |
|-----|--------|------|--------------|-------|
| `/api/v1/news` | GET | No | `limit` (default 20, max 50), `offset`, `categoryId?` | Approved/published only. Sorted by `createdAt` desc. |
| `/api/v1/news/:id` | GET | No | — | Single post with populated categoryId. |

### Categories

| API | Method | Auth | Notes |
|-----|--------|------|-------|
| `/api/v1/categories` | GET | No | All categories, sorted by name. Used for news feed filters. |

### Posts (Create, Like, Comment, Reply)

| API | Method | Auth | Request Body | Notes |
|-----|--------|------|--------------|-------|
| `/api/v1/posts` | POST | Bearer | `{ title, content?, media: [{ url, type, publicId? }], categoryId, expiryAt? }` | Status `pending` (admin approval). `postType` auto from media. |
| `/api/v1/posts/:id/like` | POST | Bearer | — | Idempotent. Increments likesCount. |
| `/api/v1/posts/:id/like` | DELETE | Bearer | — | Unlike. Decrements likesCount. |
| `/api/v1/posts/:id/share` | POST | Bearer | — | Increments sharesCount. |
| `/api/v1/posts/:id/comments` | GET | No | `limit` (50), `offset` | Top-level + nested replies. Sorted desc/asc. |
| `/api/v1/posts/:id/comments` | POST | Bearer | `{ content }` | Add top-level comment. |
| `/api/v1/comments/:id/reply` | POST | Bearer | `{ content }` | Reply to comment. |
| `/api/v1/comments/:id/like` | POST | Bearer | — | Like comment. Idempotent. |

### Events

| API | Method | Auth | Request Body | Query Params | Notes |
|-----|--------|------|--------------|--------------|-------|
| `/api/v1/events` | GET | No | — | `limit`, `offset` | Upcoming only (`date >= now`). Sorted by date asc. |
| `/api/v1/events/:id` | GET | No | — | — | Event detail with createdBy. |
| `/api/v1/events/:id/going` | POST | Bearer | `{ status?: 'going' \| 'interested' }` | — | Book event. Default `going`. Updates attendeesCount. |
| `/api/v1/events/:id/going` | DELETE | Bearer | — | — | Cancel booking. Decrements attendeesCount. |

### Businesses

| API | Method | Auth | Request Body | Notes |
|-----|--------|------|--------------|-------|
| `/api/v1/business` | GET | No | — | All non-deleted. Sorted by createdAt desc. |
| `/api/v1/business/:id` | GET | No | — | Business detail. |
| `/api/v1/business/:id/booking` | POST | Bearer | `{ notes? }` | Creates booking (status `pending`). Prevents duplicates. |

### Reports

| API | Method | Auth | Request Body | Notes |
|-----|--------|------|--------------|-------|
| `/api/v1/reports` | POST | Bearer | `{ targetType: 'post' \| 'comment' \| 'user', targetId, reportType, reason? }` | `reportType` from `/reports/types`. Status `pending`. |
| `/api/v1/reports/types` | GET | No | — | Available report types for dropdown. |

### Upload

| API | Method | Auth | Request (FormData) | Notes |
|-----|--------|------|-------------------|-------|
| `/api/v1/upload` | POST | No | `file` (required), `folder?` (posts \| businesses \| avatars \| events), `type?` (image \| video) | Cloudinary. Videos max 60s. Returns `{ url, publicId, secureUrl, duration? }`. |

---

### User API Response Format

**Success:** `{ "success": true, "data": {...}, "message": "..." }`  
**Error:** `{ "success": false, "error": "...", "code": "ERROR_CODE" }`

**Auth:** Bearer token: `Authorization: Bearer <firebaseIdToken | jwt>`  
**Status codes:** 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error

---

## 5.3 Admin Panel APIs

**Total: 35 APIs** (for Next.js admin panel)

| Category | Count | Status |
|----------|-------|--------|
| Auth | 7 | ✅ 3 built (sign-in, google, me) |
| Dashboard | 4 | ✅ 2 built (stats, top-contributors) |
| Content Management | 9 | ✅ Posts & Events CRUD built |
| User Generated | 4 | ✅ All built |
| Local Business | 5 | ✅ All built |
| Push Notifications | 5 | ✅ 2 built (list, send) |
| Admin Settings | 4 | 🔲 To build |

---

### Auth

| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/auth/admin/sign-in` | POST | Admin login ✅ |
| `/api/v1/auth/admin/google` | POST | Admin Google sign-in ✅ |
| `/api/v1/auth/admin/me` | GET | Current admin profile ✅ |
| `/api/v1/auth/admin/forgot-password` | POST | Forgot password 🔲 |
| `/api/v1/auth/admin/reset-password` | POST | Reset password 🔲 |
| `/api/v1/auth/admin/verify-otp` | POST | Verify OTP 🔲 |
| `/api/v1/auth/admin/refresh` | POST | Refresh token 🔲 |

### Dashboard

| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/admin/dashboard/stats` | GET | News posted/accepted/rejected (date filter) |
| `/api/v1/admin/dashboard/top-contributors` | GET | Top contributors |
| `/api/v1/admin/settings/post-notifications` | GET | Toggle state |
| `/api/v1/admin/settings/post-notifications` | PATCH | Enable/disable |

### Content Management

| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/admin/content/posts` | GET | All posts. Query: `?status=scheduled|published|all`, `?sort=updatedAt|createdAt`, `?limit`, `?offset` ✅ |
| `/api/v1/admin/content/posts` | POST | Create post ✅ |
| `/api/v1/admin/content/posts/:id` | GET | Single post ✅ |
| `/api/v1/admin/content/posts/:id` | PUT | Update post ✅ |
| `/api/v1/admin/content/posts/:id` | DELETE | Delete post ✅ |
| `/api/v1/admin/content/events` | GET | All events ✅ |
| `/api/v1/admin/content/events` | POST | Create event ✅ |
| `/api/v1/admin/content/events/:id` | GET, PUT, DELETE | Event CRUD ✅ |
| Last edited / Scheduled | — | Use `GET /admin/content/posts?sort=updatedAt` and `?status=scheduled` |
| `/api/v1/admin/content/posts/:id/schedule` | PATCH | Schedule 🔲 |
| `/api/v1/admin/content/posts/:id/publish` | PATCH | Publish 🔲 |

### User Generated

| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/admin/user-generated/metrics` | GET | Metrics | 
| `/api/v1/admin/user-generated/pending` | GET | Pending submissions |
| `/api/v1/admin/user-generated/:id/approve` | POST | Approve |
| `/api/v1/admin/user-generated/:id/decline` | POST | Decline |

### Local Business

| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/business` | GET | List |
| `/api/v1/business` | POST | Create |
| `/api/v1/business/:id` | GET | Single |
| `/api/v1/business/:id` | PUT | Update |
| `/api/v1/business/:id` | DELETE | Delete |

### Push Notifications (FCM)

| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/admin/push-notifications` | GET | History |
| `/api/v1/admin/push-notifications` | POST | Send (via FCM) |
| `/api/v1/admin/push-notifications/:id` | GET | Single |
| `/api/v1/admin/push-notifications/:id` | PATCH | Update draft |
| `/api/v1/admin/push-notifications/:id/send` | POST | Send draft (via FCM) |

### Admin Settings

| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/admin/profile` | GET | Profile |
| `/api/v1/admin/profile` | PATCH | Update |
| `/api/v1/admin/profile/password` | PATCH | Change password |
| `/api/v1/admin/profile` | DELETE | Delete account |

---

# 6. Firebase & FCM Setup

## 6.1 Firebase Project

1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** → **Google** provider, **Email/Password**
3. Enable **Cloud Messaging** (FCM)

## 6.2 Google Auth

- **Web (Admin)**: Add Web app → get config
- **Android (User)**: Add Android app → `google-services.json`, SHA-1
- **iOS (User)**: Add iOS app → Bundle ID, APNs key

## 6.3 FCM Flow

1. **User App**: On login → get FCM token → `POST /api/v1/user/fcm-token` → store in MongoDB `users.fcmToken`
2. **Admin Panel**: Compose notification → `POST /api/v1/admin/push-notifications` → Backend fetches FCM tokens from DB → FCM HTTP v1 API → User devices (React Native)

## 6.4 Server-Side

- Use **Firebase Admin SDK** with service account JSON
- Verify ID tokens: `admin.auth().verifyIdToken(idToken)`
- Send FCM: `admin.messaging().send()` or `sendEachForMulticast()`

---

# 7. Implementation Order (APIs)

## Phase 1 – Admin (Current)

1. **Auth** – Admin sign-in/sign-up (Firebase Auth)
2. **Dashboard** – Stats, top contributors, post notifications toggle
3. **Content Management** – CRUD posts, schedule, publish
4. **User Generated** – Pending list, approve, decline
5. **Push Notifications** – FCM send, history
6. **Admin Settings** – Profile, password
7. **Business** – Migrate existing to MongoDB (or keep Prisma until migration)

## Phase 2 – User App

1. **Auth** – Sign-up, sign-in, Google, forgot/reset password
2. **FCM Token** – Register on login
3. **News Feed** – Approved posts
4. **Create Post** – Image/video, pending
5. **Like, Comment, Reply** – Engagement
6. **Events** – List, detail, book
7. **Businesses** – List, detail, booking
8. **Reports** – Report content
9. **Profile & Settings** – Profile, notifications, password

---

# 8. File Structure (Admin Panel)

```
src/
  app/
    api/v1/           # API routes
      auth/
      business/       # ✅ exists
      admin/
    dashboard/
    content-management/
    local-business/
    user-generated/
    push-notification/
    settings/
    auth/
  components/
  lib/                # MongoDB client, Firebase Admin, helpers
  actions/            # Server actions (business.ts exists)
  types/
  constants/
  hooks/
```

---

# 9. Swagger

- Document all APIs in `docs/openapi.yaml` or `swagger.json`
- Expose at `/api-docs` or `/swagger`
- Include schemas, auth (Bearer), examples

---

*ZeeBuddy – Final API & Implementation Reference v1*
