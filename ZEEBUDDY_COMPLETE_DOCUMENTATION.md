# ZeeBuddy – Complete Documentation

Single source of truth for the ZeeBuddy project: tech stack, features, APIs, and data models.

---

# 1. Tech Stack

| Component | Technology |
|-----------|------------|
| **User App** | React Native |
| **Admin Panel** | Next.js |
| **Database** | Supabase (PostgreSQL) |
| **Auth (Email/Phone/OTP)** | Supabase Auth |
| **Auth (Google Sign-In)** | Firebase Auth |
| **Push Notifications** | FCM (Firebase Cloud Messaging) |

## 1.1 Auth Flow

- **Email/Phone + Password**: Supabase Auth
- **Email/Phone OTP**: Supabase Auth (`signInWithOtp`, `verifyOtp`)
- **Google Sign-In**: Firebase Auth → link/sync with Supabase user record

## 1.2 Push Notifications (FCM)

- **User App**: Register FCM token on login → store in Supabase `profiles.fcm_token`
- **Admin Panel**: Sends notification → API → Edge Function/Backend → FCM HTTP v1 API → User device
- **Flow**: Admin composes → `POST /api/v1/admin/push-notifications` → Backend stores in DB + sends via FCM

---

# 2. Overview

| App | Role |
|-----|------|
| **User App** | View news, get push notifications (FCM), create posts (image/video), like, comment, reply. Profile & settings. |
| **Admin Panel** | Create news, approve user posts, manage businesses, send push notifications (FCM), settings. |

**Flow**: User creates post (image or video) → **Admin approves** → Post goes live in news feed.

---

# 3. Admin Panel – UI & Features

## 3.1 Navigation

| Route | Label | Description |
|-------|-------|-------------|
| `/dashboard` | Dashboard | Stats, post notifications toggle, top contributors |
| `/content-management` | Content Management | Last edited, scheduled, my posts |
| `/local-business` | Local Business | Add/view/edit businesses |
| `/local-business/[id]` | Business Detail | Single business view |
| `/user-generated` | User Generated | Approve/decline user posts |
| `/push-notification` | Push Notification | Compose & send via FCM |
| `/settings` | Settings | Profile, personal info, general |
| `/auth/sign-in` | Sign In | Admin login |
| `/auth/sign-up` | Sign Up | Admin registration |

## 3.2 Dashboard

- Overview: Total news posted, accepted, rejected (date filter)
- Post notifications: Toggle on/off for users
- Top contributors: Users with most posts

## 3.3 Content Management

- Last Edited: Most recent edit
- Scheduled: List of scheduled posts
- My Posts: Grid – edit, schedule, send, delete

## 3.4 Local Business

- Add Business: Name, services, hours, description, type, areas, images
- View All: List with edit/delete
- Detail: Hero, gallery, about, details

## 3.5 User Generated

- Metrics: Overall users %, total posts, live posts
- Pending list: User posts (image/video) – **Approve** or **Decline**

## 3.6 Push Notification (FCM)

- History: Sent notifications (name, date, time, status)
- Compose: Title, body, Send
- Preview: Live preview
- Backend sends via **FCM HTTP v1 API** to stored device tokens

## 3.7 Settings

- Profile: Avatar, name
- Personal Info: Full name, phone, email, password, account type, language
- General: Other settings
- Delete Account: Button

---

# 4. User App – Features

## 4.1 News Feed

- User sees **approved** news/posts (images or videos)
- Categories, time frame, headings, details
- **Push notifications (FCM)** for news they’re interested in

## 4.2 Create Post

- User can create **image posts** or **video posts**
- Details + media
- Status: **pending** until admin approves

## 4.3 Engagement

- Like on posts
- Comment on posts
- Reply to comments
- Share posts

## 4.4 Profile & Settings

- Edit profile
- Change password

## 4.5 Other

- Events: Upcoming events, going/not going
- Local Businesses: Browse, details, service booking
- Reports: Report video/post

---

# 5. API Reference

## 5.1 User App APIs

### Auth
| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/auth/sign-in` | POST | Login (email/phone + password or OTP) ✅ |
| `/api/v1/auth/sign-up` | POST | Register ✅ |
| `/api/v1/auth/google` | POST | Google sign-in (Firebase Auth) ✅ |
| `/api/v1/auth/forgot-password` | POST | Forgot password ✅ |
| `/api/v1/auth/reset-password` | POST | Reset password ✅ |
| `/api/v1/auth/verify-otp` | POST | Verify OTP ✅ |
| `/api/v1/auth/refresh` | POST | Refresh token 🔲 |

### FCM Token (Push Notifications)
| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/user/fcm-token` | POST | Register/update FCM device token |

### Profile & Settings
| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/user/profile` | GET | Get profile |
| `/api/v1/user/profile` | PATCH | Edit profile |
| `/api/v1/user/change-password` | PATCH | Change password |

### News
| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/news` | GET | News feed (approved content) ✅ |
| `/api/v1/news/:id` | GET | Single news/post ✅ |
| `/api/v1/categories` | GET | News categories (shared) ✅ |

### Posts (Create, Like, Comment, Reply)
| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/posts` | POST | Create post (image/video) – **pending approval** |
| `/api/v1/posts/:id/like` | POST | Like |
| `/api/v1/posts/:id/like` | DELETE | Unlike |
| `/api/v1/posts/:id/share` | POST | Share |
| `/api/v1/posts/:id/comments` | GET | Get comments |
| `/api/v1/posts/:id/comments` | POST | Add comment |
| `/api/v1/comments/:id/reply` | POST | Reply |
| `/api/v1/comments/:id/like` | POST | Like comment |

### Events
| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/events` | GET | Upcoming events ✅ |
| `/api/v1/events/:id` | GET | Event detail ✅ |
| `/api/v1/events/:id/going` | POST | Going 🔲 |
| `/api/v1/events/:id/going` | DELETE | Not going 🔲 |

### Local Businesses
| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/business` | GET | List businesses ✅ |
| `/api/v1/business/:id` | GET | Business detail ✅ |
| `/api/v1/business/:id/booking` | POST | Book service 🔲 |
| `/api/v1/categories` | GET | Categories (shared) ✅ |

### Reports
| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/reports` | POST | Report content |
| `/api/v1/reports/types` | GET | Report types |

---

## 5.2 Admin Panel APIs

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
| `/api/v1/admin/dashboard/stats` | GET | News posted/accepted/rejected |
| `/api/v1/admin/dashboard/top-contributors` | GET | Top contributors |
| `/api/v1/admin/settings/post-notifications` | GET | Toggle state |
| `/api/v1/admin/settings/post-notifications` | PATCH | Enable/disable |

### Content Management
| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/admin/content/posts` | GET, POST | Posts CRUD ✅ |
| `/api/v1/admin/content/posts/:id` | GET, PUT, DELETE | Post by ID ✅ |
| `/api/v1/admin/content/events` | GET, POST | Events CRUD ✅ |
| `/api/v1/admin/content/events/:id` | GET, PUT, DELETE | Event by ID ✅ |
| `/api/v1/admin/content/last-edited` | GET | Last edited post 🔲 |
| `/api/v1/admin/content/scheduled` | GET | Scheduled posts 🔲 |
| `/api/v1/admin/content/posts/:id/schedule` | PATCH | Schedule 🔲 |
| `/api/v1/admin/content/posts/:id/publish` | PATCH | Publish 🔲 |

### User Generated
| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/admin/user-generated/metrics` | GET | Metrics ✅ |
| `/api/v1/admin/user-generated/pending` | GET | Pending submissions ✅ |
| `/api/v1/admin/user-generated/:id/approve` | POST | Approve ✅ |
| `/api/v1/admin/user-generated/:id/decline` | POST | Decline ✅ |

### Local Business
| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/business` | GET, POST | List, Create ✅ |
| `/api/v1/business/:id` | GET, PUT, DELETE | Single, Update, Delete ✅ |

### Push Notifications (FCM)
| API | Method | Purpose |
|-----|--------|---------|
| `/api/v1/admin/push-notifications` | GET | History ✅ |
| `/api/v1/admin/push-notifications` | POST | Send (via FCM) ✅ |
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

# 6. Data Models

## 6.1 User / Profile
```
id (uuid), email, phone, role: 'user' | 'admin'
firebase_uid (for Google-linked users)
fcm_token (for push notifications)
name, avatar_url, createdAt, updatedAt
```

## 6.2 Post/News (unified)
```
id, title, content, media (images[] or videos[])
type: 'image' | 'video'
categoryId, status: 'pending' | 'approved' | 'rejected' | 'published' | 'scheduled'
authorId (user or admin), createdAt, updatedAt, scheduledAt
likesCount, commentsCount, sharesCount
```

## 6.3 Comment
```
id, postId, userId, parentId (null = top-level, else = reply)
content, createdAt
likesCount
```

## 6.4 Business
```
id, businessName, services, serviceHours
businessDescription, businessType, serviceAreas
images[], createdAt, updatedAt
```

## 6.5 Push Notification (FCM)
```
id, title, body, status: 'draft' | 'sent' | 'pending'
sentAt, createdAt, targetAudience (all | segment)
fcm_tokens[] (or fetched from profiles)
```

---

# 7. Firebase Setup (Google Auth + FCM)

## 7.1 Firebase Project

1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** → **Google** provider
3. Enable **Cloud Messaging** (FCM)

## 7.2 Google Auth

- **Web (Admin)**: Add Web app → get config
- **Android (User)**: Add Android app → `google-services.json`, SHA-1
- **iOS (User)**: Add iOS app → Bundle ID, upload APNs key

## 7.3 FCM

- **Server key**: Project Settings → Cloud Messaging → Generate key (Legacy) or use **Service Account** for HTTP v1
- **HTTP v1**: Service Account → Create key (JSON) → Use for server-side send

## 7.4 User App (React Native)

- `@react-native-firebase/app`
- `@react-native-firebase/auth` (Google sign-in)
- `@react-native-firebase/messaging` (FCM)
- On login: get FCM token → `POST /api/v1/user/fcm-token`

## 7.5 Admin Panel (Next.js)

- `firebase` SDK for Google sign-in (web)
- Push send: Backend/Edge Function uses FCM HTTP v1 API with service account

---

# 8. Implementation Order

**Phase 1 – Admin**
1. Auth (Supabase + Firebase Google)
2. Dashboard
3. Content management
4. User-generated (approve/decline)
5. Push notifications (FCM)
6. Admin settings
7. Business (extend existing)

**Phase 2 – User**
1. Auth (Supabase + Firebase Google)
2. FCM token registration
3. News feed
4. Create post (image/video)
5. Like, comment, reply, share
6. Events
7. Local businesses
8. Reports
9. Profile & settings

---

*ZeeBuddy – Complete Documentation v1*
