# ZeeBuddy – User App Integration Guide

**Complete API reference and setup guide for building the ZeeBuddy user app.** Use this document when integrating with the backend from any client (React Native, Flutter, etc.).

**How to use this guide:** Section **2.1** lists every user app API in one table. Section **3** explains auth (including Firebase Auth). Section **4** has full request/response and error details for each API. Sections **5–8** cover FCM, implementation checklist, environment variables, and error handling. Nothing is missed — all 36 user app endpoints are documented.

---

# 1. Overview

| Item | Value |
|------|-------|
| **Base URL** | `https://your-api-domain.com` (replace with actual deployed URL) |
| **API Prefix** | `/api/v1` |
| **Auth** | Bearer token (user JWT from sign-in/confirm-sign-up/Google, or Firebase ID token) |
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

**Common error codes:** `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `SERVER_ERROR`, `EMAIL_EXISTS`, `EMAIL_NOT_FOUND`, `USE_GOOGLE`, `INVALID_OTP`, `EMAIL_SEND_FAILED`, `ALREADY_BOOKED`, `MISSING_TOKEN`.

---

# 2.1 Complete User App API Index

Every user-facing API is listed below. Details for each are in section 4.

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 1 | POST | `/api/v1/auth/sign-up` | No | Send OTP to email (step 1) |
| 2 | POST | `/api/v1/auth/confirm-sign-up` | No | Verify OTP, create account (step 2) |
| 3 | POST | `/api/v1/auth/sign-in` | No | Email/password login |
| 4 | POST | `/api/v1/auth/google` | No | Google login (send Firebase idToken) |
| 5 | POST | `/api/v1/auth/forgot-password` | No | Send reset OTP to email |
| 6 | POST | `/api/v1/auth/verify-otp` | No | Verify OTP (optional step) |
| 7 | POST | `/api/v1/auth/reset-password` | No | Set new password with OTP |
| 8 | POST | `/api/v1/auth/refresh` | Bearer | Get fresh user |
| 9 | GET | `/api/v1/user/profile` | Bearer | Get profile |
| 10 | PATCH | `/api/v1/user/profile` | Bearer | Update profile (name, phone, avatarUrl) |
| 11 | POST | `/api/v1/user/profile/avatar` | Bearer | Upload avatar image |
| 12 | PATCH | `/api/v1/user/change-password` | Bearer | Change password |
| 13 | GET | `/api/v1/user/settings` | Bearer | Get notification settings |
| 14 | PATCH | `/api/v1/user/settings` | Bearer | Update notification settings |
| 15 | POST | `/api/v1/user/fcm-token` | Bearer | Register FCM token for push |
| 16 | GET | `/api/v1/news` | No | News feed (paginated) |
| 17 | GET | `/api/v1/news/:id` | No | Single news post |
| 18 | GET | `/api/v1/categories` | No | List categories |
| 19 | POST | `/api/v1/posts` | Bearer | Create post |
| 20 | POST | `/api/v1/posts/:id/like` | Bearer | Like post |
| 21 | DELETE | `/api/v1/posts/:id/like` | Bearer | Unlike post |
| 22 | POST | `/api/v1/posts/:id/share` | Bearer | Share post |
| 23 | GET | `/api/v1/posts/:id/comments` | No | Get comments |
| 24 | POST | `/api/v1/posts/:id/comments` | Bearer | Add comment |
| 25 | POST | `/api/v1/comments/:id/reply` | Bearer | Reply to comment |
| 26 | POST | `/api/v1/comments/:id/like` | Bearer | Like comment |
| 27 | GET | `/api/v1/events` | No | Upcoming events (paginated) |
| 28 | GET | `/api/v1/events/:id` | No | Single event |
| 29 | POST | `/api/v1/events/:id/going` | Bearer | Book event (going/interested) |
| 30 | DELETE | `/api/v1/events/:id/going` | Bearer | Cancel booking |
| 31 | GET | `/api/v1/business` | No | List businesses |
| 32 | GET | `/api/v1/business/:id` | No | Single business |
| 33 | POST | `/api/v1/business/:id/booking` | Bearer | Book business |
| 34 | GET | `/api/v1/reports/types` | No | Report type options |
| 35 | POST | `/api/v1/reports` | Bearer | Submit report |
| 36 | POST | `/api/v1/upload` | No | Upload image/video (Cloudinary) |

---

# 3. Authentication

## 3.1 Auth Strategy (Summary)

| Method | Flow | Token for API calls |
|--------|------|---------------------|
| **Email/Password** | Sign up (2 steps: sign-up → OTP email → confirm-sign-up) or sign in via `POST /api/v1/auth/sign-in`. | Backend returns `{ user, token }`. Use `data.token` as Bearer. |
| **Google** | Use **Firebase Auth** on the user app (Google sign-in) → get `idToken` → `POST /api/v1/auth/google` with `idToken` → backend returns `{ user, token }`. | Use returned JWT or keep using Firebase `idToken`; backend accepts both. |
| **All protected APIs** | Header: `Authorization: Bearer <token>`. | Token = user JWT (from sign-in, confirm-sign-up, or Google) **or** Firebase ID token. |

**Refresh:** `POST /api/v1/auth/refresh` with current Bearer token returns fresh user. Use it to validate session or after refreshing Firebase `idToken` on the client.

## 3.2 Firebase Auth in the User App

**Yes — Firebase Auth works in the user app** and is the recommended way to handle Google sign-in (and optionally email/password) on the client.

### When Firebase Auth is used

- **Google sign-in (required):** The user app must use Firebase Auth (Google provider) to sign the user in on the device. The app then gets a Firebase **ID token** and sends it to your backend. The backend does **not** implement Google OAuth itself; it only verifies the token and creates/links the user in MongoDB.
- **Email/password (optional):** You can either:
  - **Backend-only:** Call `POST /api/v1/auth/sign-in` (or sign-up + confirm-sign-up) with email and password. No Firebase on client for email/password. Store the returned JWT and use it for API calls.
  - **Firebase + backend:** Use Firebase Auth (email/password) on the client as well, then send the Firebase `idToken` to the backend. Backend accepts Firebase ID token for protected routes. You can still use the backend’s sign-in/confirm-sign-up to create or validate the user and get a JWT if you prefer one token type.

### How it works (Google)

1. **User app:** Integrate Firebase Auth (React Native / Flutter SDK). Add Google sign-in (e.g. `signInWithCredential` / Google Sign-In plugin).
2. **User taps “Sign in with Google”:** Firebase Auth handles the Google flow and returns a signed-in user.
3. **Get ID token:** Call `user.getIdToken()` (or equivalent) to get the Firebase ID token string.
4. **Send to backend:** `POST /api/v1/auth/google` with body `{ "idToken": "<token>" }`.
5. **Backend:** Verifies the token with Firebase Admin SDK, finds or creates the user in MongoDB, returns `{ user, token }` (JWT). You can use either this JWT or the Firebase idToken for subsequent API calls.
6. **Protected requests:** Send `Authorization: Bearer <jwt or idToken>` on every request that requires auth.

### Backend acceptance of tokens

- **User JWT:** Issued by your backend after sign-in, confirm-sign-up, or Google. Use for all API calls if you prefer a single token type.
- **Firebase ID token:** Also accepted. If the client keeps using Firebase (e.g. for FCM or future social providers), you can send `idToken` as Bearer; the backend verifies it with Firebase and loads the user. So **Firebase Auth works end-to-end in the user app** for Google (and optionally for email/password if you use Firebase for that too).

## 3.3 Token Storage and Usage

- **User JWT:** Returned by `sign-in`, `confirm-sign-up`, and `google`. Store securely (e.g. SecureStore / Keychain). Use as `Authorization: Bearer <jwt>`.
- **Firebase ID token:** If the client uses Firebase Auth, you can send `idToken` as Bearer; backend accepts it. For a simpler model, store and use the backend-returned JWT for all API calls after the first auth call.

## 3.4 Auth Flows in Detail

### Email/Password sign-up (2 steps)

1. User enters email, firstName, lastName, password → **POST /api/v1/auth/sign-up**.
2. Backend checks if email exists → if yes: `EMAIL_EXISTS` (400). If no: generates 6-digit OTP, stores it in DB (purpose `verification`, expiry 10 min), sends OTP to email, returns 200.
3. User receives OTP (email or, in dev, from response/console if `devOtp` is returned). User enters OTP.
4. **POST /api/v1/auth/confirm-sign-up** with email, otp, password, firstName, lastName. Backend verifies OTP, deletes it, creates user in MongoDB, returns `{ user, token }`. Store token and treat user as logged in.

### Email/Password sign-in

1. User enters email and password → **POST /api/v1/auth/sign-in**.
2. Backend validates credentials; if account was created with Google only, returns `USE_GOOGLE` (400). Otherwise returns `{ user, token }`. Store token for API calls.

### Google sign-in (Firebase Auth in user app)

1. In the user app, use Firebase Auth with Google provider (e.g. Google Sign-In button). User completes Google flow.
2. Get Firebase ID token: `user.getIdToken()` (or platform equivalent).
3. **POST /api/v1/auth/google** with body `{ "idToken": "<token>" }`. Backend verifies token with Firebase Admin, finds or creates user in MongoDB, returns `{ user, token }`. Store token (or keep using idToken; both work for Bearer).

### Forgot password

1. User enters email → **POST /api/v1/auth/forgot-password**. If email not registered: `EMAIL_NOT_FOUND` (404). If registered: OTP sent to email, 200.
2. User enters OTP and new password → **POST /api/v1/auth/reset-password** with email, otp, newPassword. On success, user can sign in with the new password.

### Change password (logged-in user)

**PATCH /api/v1/user/change-password** with Bearer token and body `{ currentPassword, newPassword }`. Only for email/password accounts; returns `USE_GOOGLE` for Google-only accounts.

---

## 3.5 Firebase Auth – Quick Answer

**Will Firebase Auth work in the user app?** **Yes.** Use Firebase Auth in the user app for:

- **Google sign-in:** Required. The app uses Firebase Auth (Google) to get an ID token, then sends it to `POST /api/v1/auth/google`. The backend verifies the token and returns a user + JWT. Firebase Auth is the standard way to do Google sign-in in the user app.
- **Optional – email/password:** You can use Firebase Auth for email/password on the client too; the backend accepts Firebase ID token as Bearer. Or you can use only the backend endpoints (sign-in, sign-up, confirm-sign-up) without Firebase for email/password.
- **FCM:** Firebase Cloud Messaging uses the same Firebase project; register the FCM token with the backend after login.

The backend accepts **both** the user JWT it returns and the **Firebase ID token** for protected routes, so Firebase Auth integrates fully with your APIs.

---

# 4. API Reference (User App)

## 4.1 Auth

### POST /api/v1/auth/sign-up (Step 1)
**Purpose:** Start registration. Sends 6-digit OTP to email. Account is **not** created yet.  
**Auth:** None.

**Request:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "min6chars"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Verification code sent to your email. Check your inbox and confirm to complete sign-up." }
}
```

**Errors:** `EMAIL_EXISTS` (400) – email already registered. User should sign in instead.

**Development:** If the server cannot send email (e.g. SMTP not configured), the response may include `data.devOtp` with the 6-digit code so you can still test; use it in confirm-sign-up.

**Next step:** User enters OTP from email (or `devOtp` in dev) → call `POST /api/v1/auth/confirm-sign-up` with same email, OTP, password, firstName, lastName.

---

### POST /api/v1/auth/confirm-sign-up (Step 2)
**Purpose:** Verify OTP and create account. Call after user receives OTP from sign-up.  
**Auth:** None.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "password": "min6chars",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "name": "John Doe",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "avatarUrl": null,
      "phone": null,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "token": "eyJhbGc...",
    "message": "Account created successfully."
  }
}
```

Store `data.token` for authenticated requests. **Errors:** `INVALID_OTP` (400), `EMAIL_EXISTS` (400).

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
    "user": { "_id": "...", "email": "...", "name": "...", "firstName": "...", "lastName": "...", "role": "user", "avatarUrl": "...", ... },
    "token": "eyJhbGc...",
    "message": "Signed in successfully"
  }
}
```

Store `data.token` and use as `Authorization: Bearer <token>` for subsequent API calls.

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
    "token": "eyJhbGc...",
    "message": "Signed in successfully"
  }
}
```

Store `data.token` for authenticated requests (or continue using Firebase idToken; both are accepted).

---

### POST /api/v1/auth/forgot-password
**Purpose:** Request OTP for password reset. Sends 6-digit OTP to the user’s email.  
**Auth:** None.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200) – email exists and OTP sent:**
```json
{
  "success": true,
  "data": { "message": "Reset code sent to your email. Check your inbox." }
}
```

**Errors:**
- `EMAIL_NOT_FOUND` (404) – No user registered with this email. Show “Email not registered” (or “Check your inbox” for parity with success, depending on product choice).
- OTP expires in 10 minutes. Use `POST /api/v1/auth/reset-password` with the same email and the OTP to set a new password.

**Development:** If the server cannot send email, the response may include `data.devOtp` so you can test the reset flow.

---

### POST /api/v1/auth/verify-otp
**Purpose:** Verify OTP (optional UI step). For sign-up flow, OTP is consumed in `confirm-sign-up`; this endpoint can be used to show "Code valid" before calling confirm-sign-up. For reset, use before or skip and call reset-password directly.  
**Auth:** None.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "reset"
}
```
`purpose`: `"reset"` | `"verification"` (sign-up) | `"signin"`.

**Response (200):**
```json
{
  "success": true,
  "data": { "verified": true, "message": "Code verified successfully" }
}
```

For `purpose: "verification"`, the OTP is not consumed here; use `confirm-sign-up` to complete sign-up.

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
**Auth:** Required. Header: `Authorization: Bearer <token>` (user JWT or Firebase ID token).

**Request:** No body.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "...",
    "name": "...",
    "firstName": "...",
    "lastName": "...",
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
**Auth:** Required (Bearer token).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "...",
    "name": "...",
    "firstName": "...",
    "lastName": "...",
    "phone": null,
    "avatarUrl": "https://...",
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
All fields optional. Send only fields to update. For avatar, prefer `POST /api/v1/user/profile/avatar` to upload and set in one call.

**Response (200):** Same shape as GET profile.

---

### POST /api/v1/user/profile/avatar
**Purpose:** Upload avatar image and set as user's profile picture. One call: upload + update.  
**Auth:** Required.

**Request:** `multipart/form-data` with `file` (required). Image only: JPEG, PNG, GIF, WebP; max 5 MB.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "...",
    "name": "...",
    "firstName": "...",
    "lastName": "...",
    "avatarUrl": "https://res.cloudinary.com/.../zeebuddy/avatars/...",
    ...
  },
  "message": "Avatar updated"
}
```

**Errors:** `VALIDATION_ERROR` (400) – not an image or too large.

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
      "_id": "...",
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
**Purpose:** Upload image or video to Cloudinary. Use for posts, events, businesses. For **user avatar**, prefer `POST /api/v1/user/profile/avatar` (auth required, sets profile picture in one call).  
**Auth:** None.

**Request:** `multipart/form-data`
- `file` (required): image or video file
- `folder` (optional): `posts` | `businesses` | `avatars` | `events` (default: `posts`)
- `type` (optional): `image` | `video` (default: `image`). When `folder` is `avatars`, only `image` is allowed.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "url": "https://...",
    "publicId": "zeebuddy/avatars/xyz",
    "secureUrl": "https://...",
    "duration": 30
  }
}
```
`duration` only for videos (seconds). Videos max 60 seconds.

**Errors:** `VIDEO_TOO_LONG` (400) – video exceeds 60 seconds. `VALIDATION_ERROR` (400) – avatars folder with type video.

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
- [ ] **Firebase Auth** in user app: add Firebase SDK, enable Google (and optionally Email/Password) provider in Firebase Console
- [ ] Sign up step 1: sign-up (email, firstName, lastName, password) → OTP sent to email
- [ ] Sign up step 2: confirm-sign-up (email, otp, password, firstName, lastName) → store token
- [ ] Sign in (email/password): POST /auth/sign-in → store token from response
- [ ] Sign in (Google): Firebase Auth Google sign-in → getIdToken() → POST /auth/google with idToken → store returned token
- [ ] Forgot password: POST /auth/forgot-password (handle EMAIL_NOT_FOUND 404)
- [ ] Reset password: POST /auth/reset-password (email, otp, newPassword)
- [ ] Auth refresh: POST /auth/refresh with Bearer token
- [ ] Persist token (SecureStore/AsyncStorage) and send as Authorization: Bearer <token>

## Profile & Settings
- [ ] Get profile
- [ ] Edit profile (name, phone, avatarUrl via PATCH)
- [ ] Upload avatar (POST /user/profile/avatar with image file)
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

# 7. Environment Variables (Client – User App)

| Variable | Description |
|----------|-------------|
| `API_BASE_URL` | Backend base URL (e.g. `https://api.zeebuddy.com`) |
| **Firebase config** | From Firebase Console: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`. Required for Firebase Auth (Google sign-in) and FCM in the user app. Same project as the backend uses for token verification and FCM. |

---

# 8. Error Handling

Always check `success` in response. On `success: false`:
- Read `error` for user-facing message
- Use `code` for programmatic handling (e.g. `EMAIL_EXISTS` → show "Sign in instead")
- Map HTTP status: 401 → logout, 403 → show forbidden, 404 → not found UI

---

**Summary:** This guide is the single source for integrating the **user app** (React Native, Flutter, or any client) with the ZeeBuddy backend. **Firebase Auth works in the user app** for Google sign-in (and optionally email/password); the backend verifies Firebase ID tokens and also issues its own JWT. Use this doc for all user-facing API flows. For admin panel APIs and MongoDB schemas, see **ZEEBUDDY_API_REFERENCE.md**.
