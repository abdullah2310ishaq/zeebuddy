# API Changes & User App Integration Guide

This document describes **recent API changes** and **Business API details** so the **user app (React Native)** and Cursor can integrate correctly. Use it alongside `ZEEBUDDY_API_REFERENCE.md`.

---

## 1. Recent API Changes (Admin & User)

### 1.1 News / Posts – Author on Single Post (User app)

**Endpoint:** `GET /api/v1/news/:id`

**Change:** Response now includes an **`author`** object when the post is user-generated (`authorType === 'user'`).

**Response shape (relevant fields):**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "...",
    "content": "...",
    "status": "approved",
    "authorType": "user",
    "categoryId": { "name": "...", "slug": "..." },
    "media": [{ "url": "...", "type": "image" | "video" }],
    "createdAt": "...",
    "author": {
      "id": "userId",
      "name": "User Display Name",
      "avatarUrl": "https://..."
    }
  }
}
```

- **`author`** is only present when `authorType === 'user'`. For admin posts, `author` is omitted (or can be `undefined`).
- **User app:** Use `data.author` to show “Posted by [name]” with optional avatar. Handle missing `author` for admin posts.

---

### 1.2 User-Generated Content – Author in Admin Lists

**Endpoints:**

- `GET /api/v1/admin/user-generated/pending`
- `GET /api/v1/admin/user-generated/posts`

**Change:** Each post in the list now includes **`author`** with `id`, `name`, `email`, `avatarUrl`.

**Pending item shape (example):**

```json
{
  "id": "postId",
  "title": "...",
  "content": "...",
  "media": [...],
  "postType": "image",
  "category": { "name": "..." },
  "author": {
    "id": "userId",
    "name": "User Name",
    "email": "user@example.com",
    "avatarUrl": "https://..."
  },
  "createdAt": "..."
}
```

**User-generated posts list** uses the same `author` shape (with `id`, `name`, `email`, `avatarUrl`).

---

### 1.3 Push Notifications on Approve / Decline (User app)

When an admin **approves** or **declines** a user’s news post, the **post author** receives a push notification (if they have FCM token and post notifications enabled).

| Admin action | Endpoint | Push to author |
|--------------|----------|-----------------|
| Approve      | `POST /api/v1/admin/user-generated/:id/approve` | “Your news was approved!” + post title |
| Decline      | `POST /api/v1/admin/user-generated/:id/decline`  | “Your news was declined” + post title |

**FCM data payload (for user app):**

- `type`: `"post_approved"` or `"post_rejected"`
- `postId`: string (MongoDB post `_id`)

**User app:** Handle these notification types (e.g. open post detail when tapped).

---

## 2. Business API – Full Reference for User App

Base path: **`/api/v1`**. All responses use the standard shape: `{ "success": true | false, "data": {...}, "error": "...", "message": "..." }`.

### 2.1 List Businesses (User app)

**`GET /api/v1/business`**

**Auth:** Not required (public list).

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "businessId",
      "businessName": "string",
      "services": ["care", "groom", "bath"],
      "serviceHours": "9:00 AM - 5:00 PM",
      "businessDescription": "string",
      "businessType": "string",
      "serviceAreas": "string",
      "images": ["url1", "url2"],
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ]
}
```

**Important:** `services` is always an **array of strings** (1–3 items). Do not use `.charAt()` or string-only methods; use `Array.isArray(services) ? services : []` for safety.

---

### 2.2 Get Single Business (User app)

**`GET /api/v1/business/:id`**

**Auth:** Not required.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "businessId",
    "businessName": "string",
    "services": ["care", "groom"],
    "serviceHours": "string",
    "businessDescription": "string",
    "businessType": "string",
    "serviceAreas": "string",
    "images": ["url1", "url2"],
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

Again, **`services` is `string[]`**. To show a primary service label:  
`const primary = Array.isArray(services) ? services[0] : (typeof services === 'string' ? services : '');`

---

### 2.3 Book a Business (User app)

**`POST /api/v1/business/:id/booking`**

**Auth:** Required (user JWT in `Authorization: Bearer <token>`).

**Body:**

```json
{
  "notes": "optional string"
}
```

**Success (201):**

```json
{
  "success": true,
  "data": {
    "_id": "bookingId",
    "businessId": { "businessName": "...", "services": ["..."] },
    "userId": "...",
    "status": "pending",
    "notes": "...",
    "createdAt": "..."
  },
  "message": "Booking created"
}
```

**Errors:**

- `400` – Invalid business ID, or user already has a non-cancelled booking for this business (`ALREADY_BOOKED`).
- `401` – Unauthorized (missing or invalid token).
- `404` – Business not found.

---

### 2.4 Business Model (MongoDB) – Reference

| Field               | Type     | Notes                          |
|---------------------|----------|---------------------------------|
| businessName        | string   | Required                        |
| services            | string[] | 1–3 items required              |
| serviceHours        | string   | Default `""`                    |
| businessDescription | string   | Default `""`                    |
| businessType        | string   | Required                        |
| serviceAreas        | string   | Default `""`                   |
| images              | string[] | URLs (e.g. Cloudinary)          |
| deletedAt           | Date?    | Soft delete; list/get exclude   |

---

## 3. Summary for Cursor / User-Side Integration

1. **News single post (`GET /api/v1/news/:id`)**  
   - Use `data.author` when present (`id`, `name`, `avatarUrl`) to show “Posted by …”.  
   - `author` is only set for user-generated posts.

2. **Business `services`**  
   - Always treat as **array** in TypeScript and UI: `services: string[]`.  
   - Never assume `services` is a string (no `.charAt()`); normalize with `Array.isArray(services) ? services : []`.

3. **Business APIs for user app**  
   - List: `GET /api/v1/business` → `data[]` with `id`, `businessName`, `services[]`, `images[]`, etc.  
   - Detail: `GET /api/v1/business/:id` → same shape.  
   - Book: `POST /api/v1/business/:id/booking` with optional `{ notes }`, auth required.

4. **Push on approve/decline**  
   - User receives FCM with `type`: `post_approved` | `post_rejected` and `postId`; handle in the user app (e.g. deep link to post).

5. **Admin user-generated lists**  
   - Pending and approved lists now include `author: { id, name, email, avatarUrl }` per post for admin UI only.

---

## 4. Related Files (Admin Codebase)

| Area              | Path |
|-------------------|------|
| News single (author) | `src/app/api/v1/news/[id]/route.ts` |
| User-generated pending | `src/app/api/v1/admin/user-generated/pending/route.ts` |
| User-generated posts   | `src/app/api/v1/admin/user-generated/posts/route.ts` |
| Approve (push)    | `src/app/api/v1/admin/user-generated/[id]/approve/route.ts` |
| Decline (push)    | `src/app/api/v1/admin/user-generated/[id]/decline/route.ts` |
| Business list     | `src/app/api/v1/business/route.ts` |
| Business one      | `src/app/api/v1/business/[id]/route.ts` |
| Business booking  | `src/app/api/v1/business/[id]/booking/route.ts` |
| Business model    | `src/models/Business.ts` |

---

## 5. Google Auth (User App) – 400 / Not Working

For **Google sign-in on the user app** we use Firebase Auth: the app sends the **Firebase ID token** to `POST /api/v1/auth/google`. If the user app gets **400** or auth “not working”, see the dedicated guide:

- **Full doc:** [GOOGLE_AUTH_USER_APP.md](./GOOGLE_AUTH_USER_APP.md) (in this `docs/` folder).

**Short summary:**

- **Backend expects:** `POST`, `Content-Type: application/json`, body `{ "idToken": "<Firebase ID token>" }`. Key must be `idToken`; value must be the token from Firebase’s `user.getIdToken()` after Google sign-in via Firebase Auth.
- **400** = missing or invalid body / missing `idToken` (wrong key, empty, or not JSON). Backend returns `MISSING_TOKEN` or `INVALID_BODY`.
- **401** = token invalid or expired: usually **wrong Firebase project** (user app must use the same project as backend `FIREBASE_PROJECT_ID`), or expired token, or sending Google OAuth access token instead of Firebase ID token.
- **User app (Expo) config:** Same Firebase project; `google-services.json` (Android) and `GoogleService-Info.plist` (iOS); correct SHA-1 on Android; get Firebase user via Google → `user.getIdToken()` → send that to `/api/v1/auth/google`. Details and troubleshooting are in **GOOGLE_AUTH_USER_APP.md**.

This doc is the helping reference for API changes and business + user integration; use it with the main `ZEEBUDDY_API_REFERENCE.md` for full API and schema coverage.
