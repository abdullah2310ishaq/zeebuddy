# ZeeBuddy – User App Integration Guide

**Complete API reference and setup guide for building the ZeeBuddy user app.** Use this document when integrating with the backend from any client (React Native, Flutter, etc.).

---

# 1. Overview

| Item | Value |
|------|-------|
| **Base URL** | `https://your-api-domain.com` (replace with actual deployed URL) |
| **API Prefix** | `/api/v1` |
| **Auth** | Bearer token (Firebase ID token for user app) |
| **Content-Type** | `application/json` (except upload: `multipart/form-data`) |

---

# 2. Response Format

All APIs return a consistent shape:

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}

// Error
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

**Common HTTP status codes:** `200` OK, `201` Created, `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `500` Server Error.

**Common error codes:** `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `SERVER_ERROR`, `EMAIL_EXISTS`, `USE_GOOGLE`, `INVALID_OTP`, `ALREADY_BOOKED`.

---

# 3. Authentication

## 3.1 Auth Strategy

- **Email/Password users:** Sign in via `POST /api/v1/auth/sign-in` → receive `user` object. For subsequent API calls, use **Firebase ID token** from `Firebase Auth` (sign in with email/password on client, get `idToken`).
- **Google users:** Sign in via Firebase Auth (Google) on client → get `idToken` → call `POST /api/v1/auth/google` with `idToken` → receive `user`. Use same `idToken` for authenticated requests.
- **All authenticated requests:** Add header `Authorization: Bearer <idToken>`.

## 3.2 Getting Firebase ID Token

Client must use Firebase Auth SDK:
- Email/password: `signInWithEmailAndPassword` → `user.getIdToken()`
- Google: `signInWithPopup` or `signInWithCredential` → `user.getIdToken()`
- Refresh: `user.getIdToken(true)` to force refresh when token expires

---

# 4. API Reference (User App)

## 4.1 Auth

### POST /api/v1/auth/sign-up
**Purpose:** Register with email and password.  
**Auth:** None.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "min6chars",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "ObjectId",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "avatarUrl": null,
      "phone": null,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "message": "Registered successfully"
  }
}
```

**Errors:** `EMAIL_EXISTS` (400) – email already registered.

---

### POST /api/v1/auth/sign-in
**Purpose:** Login with email and password.  
**Auth:** None.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "email": "...", "name": "...", "role": "user", ... },
    "message": "Signed in successfully"
  }
}
```

**Note:** This API does not return a token. Client must use Firebase Auth (`signInWithEmailAndPassword`) to get `idToken` for subsequent API calls. This endpoint can be used to verify credentials before Firebase sign-in.

**Errors:** `USE_GOOGLE` (400) – account uses Google sign-in.

---

### POST /api/v1/auth/google
**Purpose:** Google sign-in. Creates user if new, links if existing.  
**Auth:** None.

**Request:**
```json
{
  "idToken": "Firebase ID token from Google sign-in"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "email": "...", "name": "...", "avatarUrl": "...", "role": "user", ... },
    "message": "Signed in successfully"
  }
}
```

---

### POST /api/v1/auth/forgot-password
**Purpose:** Request OTP for password reset. Sends 6-digit OTP to email.  
**Auth:** None.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Reset code sent to your email. Check your inbox." }
}
```

**Note:** OTP expires in 10 minutes. Same response even if email not found (security).

---

### POST /api/v1/auth/verify-otp
**Purpose:** Verify OTP before reset (optional step).  
**Auth:** None.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "reset"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "verified": true, "message": "Code verified successfully" }
}
```

---

### POST /api/v1/auth/reset-password
**Purpose:** Reset password using OTP.  
**Auth:** None.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Password reset successfully. You can now sign in." }
}
```

**Errors:** `INVALID_OTP` (400) – invalid or expired OTP.

---

### POST /api/v1/auth/refresh
**Purpose:** Verify session and get fresh user data.  
**Auth:** Required (Bearer token).

**Request:** No body. Header: `Authorization: Bearer <idToken>`.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "...",
    "name": "...",
    "role": "user",
    "avatarUrl": "...",
    "phone": "...",
    "notificationSettings": { ... },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## 4.2 User Profile & Settings

### GET /api/v1/user/profile
**Purpose:** Get current user profile.  
**Auth:** Required.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "...",
    "name": "...",
    "phone": null,
    "avatarUrl": null,
    "role": "user",
    "notificationSettings": {
      "postApprovalRejection": true,
      "adminPush": true,
      "eventReminders": true
    },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### PATCH /api/v1/user/profile
**Purpose:** Update profile.  
**Auth:** Required.

**Request:**
```json
{
  "name": "New Name",
  "phone": "+1234567890",
  "avatarUrl": "https://..."
}
```
All fields optional. Send only fields to update.

**Response (200):** Same shape as GET profile.

---

### PATCH /api/v1/user/change-password
**Purpose:** Change password (email/password users only).  
**Auth:** Required.

**Request:**
```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Password changed" }
}
```

**Errors:** `USE_GOOGLE` (400) – account uses Google; `INVALID_PASSWORD` (400) – wrong current password.

---

### GET /api/v1/user/settings
**Purpose:** Get notification preferences.  
**Auth:** Required.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notificationSettings": {
      "postApprovalRejection": true,
      "adminPush": true,
      "eventReminders": true
    }
  }
}
```

---

### PATCH /api/v1/user/settings
**Purpose:** Update notification preferences.  
**Auth:** Required.

**Request:**
```json
{
  "notificationSettings": {
    "postApprovalRejection": true,
    "adminPush": true,
    "eventReminders": false
  }
}
```
All keys optional. `true` = receive, `false` = opt out.

---

### POST /api/v1/user/fcm-token
**Purpose:** Register FCM device token for push notifications. Call after login.  
**Auth:** Required.

**Request:**
```json
{
  "fcmToken": "device FCM token from Firebase Messaging"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "FCM token registered" }
}
```

---

## 4.3 News Feed

### GET /api/v1/news
**Purpose:** News feed (approved posts only), paginated.  
**Auth:** None.

**Query params:** `limit` (default 20, max 50), `offset` (default 0), `categoryId` (optional).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "...",
        "title": "...",
        "content": "...",
        "media": [{ "url": "...", "type": "image" | "video", "publicId": "..." }],
        "postType": "image" | "video" | "text",
        "categoryId": { "_id": "...", "name": "...", "slug": "..." },
        "status": "approved",
        "likesCount": 0,
        "commentsCount": 0,
        "sharesCount": 0,
        "expiryAt": null,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

---

### GET /api/v1/news/:id
**Purpose:** Single news post.  
**Auth:** None.

**Response (200):** Single post object (same shape as feed item).

---

### GET /api/v1/categories
**Purpose:** List categories (for news filter, post creation).  
**Auth:** None.

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "_id": "...", "name": "...", "slug": "...", "createdAt": "...", "updatedAt": "..." }
  ]
}
```

---

## 4.4 Posts (Create, Like, Comment)

### POST /api/v1/posts
**Purpose:** Create post (image/video). Status = `pending` until admin approves.  
**Auth:** Required.

**Request:**
```json
{
  "title": "Post title",
  "content": "Optional description",
  "media": [
    { "url": "https://...", "type": "image", "publicId": "..." },
    { "url": "https://...", "type": "video", "publicId": "..." }
  ],
  "categoryId": "ObjectId",
  "expiryAt": "2025-12-31T23:59:59.000Z"
}
```
`media` and `expiryAt` optional. Upload media first via `/api/v1/upload`, then use returned `url` and `publicId`.

**Response (201):** Created post object.

---

### POST /api/v1/posts/:id/like
**Purpose:** Like a post.  
**Auth:** Required.

**Response (200/201):**
```json
{
  "success": true,
  "data": { "liked": true, "postId": "..." }
}
```

---

### DELETE /api/v1/posts/:id/like
**Purpose:** Unlike a post.  
**Auth:** Required.

**Response (200):**
```json
{
  "success": true,
  "data": { "liked": false, "postId": "..." }
}
```

---

### POST /api/v1/posts/:id/share
**Purpose:** Increment share count.  
**Auth:** Required.

**Response (200):**
```json
{
  "success": true,
  "data": { "postId": "...", "sharesCount": 5 }
}
```

---

### GET /api/v1/posts/:id/comments
**Purpose:** Get comments with nested replies.  
**Auth:** None.

**Query params:** `limit` (default 50, max 100), `offset` (default 0).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "...",
        "postId": "...",
        "userId": { "_id": "...", "name": "...", "avatarUrl": "..." },
        "parentId": null,
        "content": "...",
        "likesCount": 0,
        "createdAt": "...",
        "replies": [
          {
            "_id": "...",
            "parentId": "...",
            "content": "...",
            "userId": { ... },
            "likesCount": 0,
            "createdAt": "..."
          }
        ]
      }
    ],
    "total": 10
  }
}
```

---

### POST /api/v1/posts/:id/comments
**Purpose:** Add top-level comment.  
**Auth:** Required.

**Request:**
```json
{
  "content": "Comment text"
}
```

**Response (201):** Created comment object.

---

### POST /api/v1/comments/:id/reply
**Purpose:** Reply to a comment.  
**Auth:** Required.

**Request:**
```json
{
  "content": "Reply text"
}
```

**Response (201):** Created reply (comment with `parentId`).

---

### POST /api/v1/comments/:id/like
**Purpose:** Like a comment.  
**Auth:** Required.

**Response (200/201):**
```json
{
  "success": true,
  "data": { "liked": true, "commentId": "..." }
}
```

---

## 4.5 Events

### GET /api/v1/events
**Purpose:** Upcoming events, paginated.  
**Auth:** None.

**Query params:** `limit` (default 20, max 50), `offset` (default 0).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "...",
        "title": "...",
        "description": "...",
        "date": "2025-03-15T00:00:00.000Z",
        "time": "18:00",
        "location": "...",
        "media": [{ "url": "...", "type": "image" | "video" }],
        "attendeesCount": 5,
        "createdBy": { "_id": "...", "name": "..." },
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "total": 10,
    "limit": 20,
    "offset": 0
  }
}
```

---

### GET /api/v1/events/:id
**Purpose:** Single event detail.  
**Auth:** None.

**Response (200):** Single event object.

---

### POST /api/v1/events/:id/going
**Purpose:** Mark as going or interested.  
**Auth:** Required.

**Request:**
```json
{
  "status": "going"
}
```
or `"status": "interested"`. Default is `going`.

**Response (200/201):**
```json
{
  "success": true,
  "data": { "eventId": "...", "userId": "...", "status": "going" }
}
```

---

### DELETE /api/v1/events/:id/going
**Purpose:** Remove going/interested status.  
**Auth:** Required.

**Response (200):**
```json
{
  "success": true,
  "data": { "eventId": "...", "removed": true }
}
```

---

## 4.6 Business

### GET /api/v1/business
**Purpose:** List all businesses.  
**Auth:** None.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "businessName": "...",
      "services": "...",
      "serviceHours": "...",
      "businessDescription": "...",
      "businessType": "...",
      "serviceAreas": "...",
      "images": ["url1", "url2"],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### GET /api/v1/business/:id
**Purpose:** Single business detail.  
**Auth:** None.

**Response (200):** Single business object.

---

### POST /api/v1/business/:id/booking
**Purpose:** Book a service at a business.  
**Auth:** Required.

**Request:**
```json
{
  "notes": "Optional booking notes"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "businessId": { "_id": "...", "businessName": "...", "services": "..." },
    "userId": "...",
    "status": "pending",
    "notes": "...",
    "createdAt": "..."
  }
}
```

**Errors:** `ALREADY_BOOKED` (400) – user already has active booking.

---

## 4.7 Reports

### GET /api/v1/reports/types
**Purpose:** Get report type options.  
**Auth:** None.

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "spam", "label": "Spam" },
    { "id": "inappropriate", "label": "Inappropriate content" },
    { "id": "harassment", "label": "Harassment or bullying" },
    { "id": "violence", "label": "Violence or dangerous content" },
    { "id": "hate_speech", "label": "Hate speech or symbols" },
    { "id": "false_info", "label": "False information" },
    { "id": "copyright", "label": "Copyright violation" },
    { "id": "other", "label": "Other" }
  ]
}
```

---

### POST /api/v1/reports
**Purpose:** Report content.  
**Auth:** Required.

**Request:**
```json
{
  "targetType": "post",
  "targetId": "ObjectId",
  "reportType": "spam",
  "reason": "Optional additional reason"
}
```
`targetType`: `"post"` | `"comment"` | `"user"`.  
`reportType`: one of the `id` values from `/reports/types`.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "targetType": "post",
    "targetId": "...",
    "reportType": "spam",
    "status": "pending"
  }
}
```

---

## 4.8 File Upload

### POST /api/v1/upload
**Purpose:** Upload image or video to Cloudinary. Use before creating posts.  
**Auth:** None (consider adding user auth for production).

**Request:** `multipart/form-data`
- `file` (required): image or video file
- `folder` (optional): `posts` | `businesses` | `avatars` | `events` (default: `posts`)
- `type` (optional): `image` | `video` (default: `image`)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "url": "https://...",
    "publicId": "folder/xyz",
    "secureUrl": "https://...",
    "duration": 30
  }
}
```
`duration` only for videos (seconds). Videos max 60 seconds.

**Errors:** `VIDEO_TOO_LONG` (400) – video exceeds 60 seconds.

---

# 5. Push Notifications (FCM)

## 5.1 Overview

- **Backend:** Uses Firebase Admin SDK to send FCM messages.
- **User app:** Registers FCM token via `POST /api/v1/user/fcm-token` after login.
- **Admin panel:** Sends broadcast or targeted notifications via backend.

## 5.2 Client Setup (Firebase)

### Android
1. Add Firebase to project: `google-services.json` in `android/app/`.
2. Add dependencies: `@react-native-firebase/app`, `@react-native-firebase/messaging`.
3. Request notification permission.
4. Get FCM token: `messaging().getToken()`.
5. On token refresh: `messaging().onTokenRefresh()` → call `POST /api/v1/user/fcm-token` again.

### iOS
1. Add Firebase: `GoogleService-Info.plist`.
2. Enable Push Notifications capability.
3. Upload APNs key/certificate to Firebase Console.
4. Same FCM token flow as Android.

### General Flow
```
App launch → Check permission → Get FCM token → POST /api/v1/user/fcm-token (after login)
Token refresh → POST /api/v1/user/fcm-token again
Foreground message → Handle in onMessage
Background/quit → Handle in background handler
```

## 5.3 Notification Types (from backend)

| Type | When | Data payload |
|------|------|--------------|
| `post_approved` | Admin approves user's post | `{ type, postId }` |
| `post_rejected` | Admin rejects user's post | `{ type, postId }` |
| Admin broadcast | Admin sends from panel | `{ notificationId }` |

## 5.4 User Notification Settings

Users can opt in/out via `PATCH /api/v1/user/settings`:

- `postApprovalRejection`: Notify when my post is approved/rejected
- `adminPush`: Receive admin-sent broadcasts
- `eventReminders`: Event reminders (future use)

## 5.5 Handling Notifications

- **Foreground:** Use `messaging().onMessage()` to show in-app banner or update UI.
- **Background/Terminated:** System tray notification. Optional `data` payload for deep link (e.g. open post by `postId`).

---

# 6. Implementation Checklist

## Auth
- [ ] Sign up (email/password)
- [ ] Sign in (email/password) + Firebase Auth for idToken
- [ ] Sign in (Google) + Firebase Auth
- [ ] Forgot password (OTP flow)
- [ ] Reset password
- [ ] Session refresh / token refresh
- [ ] Persist auth state (AsyncStorage/SecureStore)

## Profile & Settings
- [ ] Get profile
- [ ] Edit profile (name, phone, avatar)
- [ ] Change password
- [ ] Notification settings (GET/PATCH)
- [ ] FCM token registration (on login, on token refresh)

## News Feed
- [ ] News list (paginated, filter by category)
- [ ] News detail
- [ ] Categories list

## Posts
- [ ] Create post (upload media → create post)
- [ ] Like / unlike post
- [ ] Share post
- [ ] Comments list
- [ ] Add comment
- [ ] Reply to comment
- [ ] Like comment

## Events
- [ ] Events list (upcoming)
- [ ] Event detail
- [ ] Mark going / interested
- [ ] Remove going

## Business
- [ ] Business list
- [ ] Business detail
- [ ] Book service

## Reports
- [ ] Report types list
- [ ] Submit report

## Push Notifications
- [ ] Request permission
- [ ] Get FCM token
- [ ] Register token on login
- [ ] Handle foreground messages
- [ ] Handle background/quit (optional deep link)
- [ ] Re-register on token refresh

---

# 7. Environment Variables (Client)

| Variable | Description |
|----------|-------------|
| `API_BASE_URL` | Backend base URL (e.g. `https://api.zeebuddy.com`) |
| Firebase config | From Firebase Console (apiKey, projectId, etc.) |

---

# 8. Error Handling

Always check `success` in response. On `success: false`:
- Read `error` for user-facing message
- Use `code` for programmatic handling (e.g. `EMAIL_EXISTS` → show "Sign in instead")
- Map HTTP status: 401 → logout, 403 → show forbidden, 404 → not found UI

---

*ZeeBuddy User App Integration Guide v1*
