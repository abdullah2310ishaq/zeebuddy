# Expo (React Native) Integration Guide — Businesses API (Images + Videos)

This doc explains how to integrate **ZeeBuddy Businesses** APIs in an **Expo / React Native** app from scratch:

- Fetch businesses list + details
- Upload images/videos to Cloudinary via `/api/v1/upload`
- Create / update a business with a `media[]` payload

> **Important**  
> Businesses support **media** (images + videos). For backward compatibility the API also returns `images` (image URLs only), but **new clients should use `media`.**

---

## 1) Base URL

Set your API base URL (example):

- Production: `https://zeebuddy-moe3.vercel.app`
- Local dev: `http://<your-local-ip>:3000`

In Expo, create a config file:

```ts
// src/config/api.ts
export const API_BASE_URL = "https://zeebuddy-moe3.vercel.app";
```

### Localhost note (real device)

If you run the Expo app on a **real phone**, `http://localhost:3000` will point to the phone, not your computer.

Use your computer LAN IP instead:

- Example: `http://192.168.137.1:3000`

---

## 2) API Response Shape

Most endpoints return:

```json
{ "success": true, "data": { ... }, "message": "..." }
{ "success": false, "error": "...", "code": "..." }
```

---

## 3) Business Types (Client)

Use these types in the Expo app:

```ts
export type BusinessMediaType = "image" | "video";

export type BusinessMediaItem = {
  url: string;
  type: BusinessMediaType;
  publicId?: string;
};

export type Business = {
  id: string;
  businessName: string;
  services: string[]; // 1..3
  serviceHours: string;
  businessDescription: string;
  businessType: string;
  serviceAreas: string;
  media?: BusinessMediaItem[]; // preferred
  images: string[]; // legacy image-only list
  createdAt: string;
  updatedAt: string;
};
```

---

## 4) Fetch Businesses

### List

`GET /api/v1/business`

```ts
import { API_BASE_URL } from "./config/api";

export async function fetchBusinesses(): Promise<Business[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/business`);
  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to fetch businesses");
  return json.data as Business[];
}
```

### Details

`GET /api/v1/business/:id`

```ts
export async function fetchBusiness(id: string): Promise<Business> {
  const res = await fetch(`${API_BASE_URL}/api/v1/business/${id}`);
  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to fetch business");
  return json.data as Business;
}
```

---

## 5) Upload Media (Image/Video)

`POST /api/v1/upload` (multipart/form-data)

### Required form fields

- `file`: the actual file
- `folder`: `"businesses"`
- `type`: `"image"` or `"video"`

> Videos are limited (server-side) to **~60 seconds**.

### Picking files in Expo (recommended)

Use `expo-image-picker` (works for both images & videos).

Install:

```bash
npx expo install expo-image-picker
```

Pick:

```ts
import * as ImagePicker from "expo-image-picker";

export async function pickMedia() {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsMultipleSelection: true,
    quality: 1,
  });
  if (res.canceled) return [];
  return res.assets; // { uri, type, fileName, mimeType, ... }
}
```

### Expo example with `fetch` + `FormData`

```ts
type UploadResult = { url: string; publicId: string; secureUrl?: string; duration?: number };

export async function uploadBusinessMedia(params: {
  uri: string;
  name: string;
  mimeType: string;
}): Promise<UploadResult> {
  const isVideo = params.mimeType.startsWith("video/");
  const form = new FormData();

  form.append("file", {
    uri: params.uri,
    name: params.name,
    type: params.mimeType,
  } as any);

  form.append("folder", "businesses");
  form.append("type", isVideo ? "video" : "image");

  const res = await fetch(`${API_BASE_URL}/api/v1/upload`, {
    method: "POST",
    body: form,
  });

  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(json?.error || "Upload failed");
  return json.data as UploadResult;
}
```

---

## 6) Create a Business (with media[])

`POST /api/v1/business`

Payload (recommended):

```json
{
  "businessName": "ABC Grooming",
  "services": ["groom", "bath"],
  "serviceHours": "9am - 5pm",
  "businessDescription": "Friendly pet grooming",
  "businessType": "Service",
  "serviceAreas": "Lahore",
  "media": [
    { "url": "https://res.cloudinary.com/.../image.jpg", "type": "image", "publicId": "..." },
    { "url": "https://res.cloudinary.com/.../video.mp4", "type": "video", "publicId": "..." }
  ]
}
```

Expo code:

```ts
export async function createBusiness(payload: Omit<Business, "id" | "createdAt" | "updatedAt">) {
  const res = await fetch(`${API_BASE_URL}/api/v1/business`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to create business");
  return json.data as Business;
}
```

### Full flow example (Pick → Upload → Create)

```ts
import { pickMedia } from "./pickMedia";

export async function createBusinessWithUploads() {
  const assets = await pickMedia();

  const uploaded = await Promise.all(
    assets.map(async (a) => {
      const name = a.fileName || (a.uri.split("/").pop() ?? "upload");
      const mimeType = a.mimeType || (a.type === "video" ? "video/mp4" : "image/jpeg");

      const up = await uploadBusinessMedia({ uri: a.uri, name, mimeType });
      return {
        url: up.url,
        publicId: up.publicId,
        type: mimeType.startsWith("video/") ? ("video" as const) : ("image" as const),
      };
    })
  );

  const payload = {
    businessName: "Test Video",
    services: ["food"],
    serviceHours: "9:00 AM - 5:00 PM",
    businessDescription: "Hello from Expo",
    businessType: "Restaurant",
    serviceAreas: "Germany",
    media: uploaded,
  };

  return await createBusiness(payload as any);
}
```

---

## 7) Update a Business (with media[])

`PUT /api/v1/business/:id`

Send only fields you want to update. For media updates, send full `media` array.

```ts
export async function updateBusiness(id: string, patch: Partial<Business> & { media?: BusinessMediaItem[] }) {
  const res = await fetch(`${API_BASE_URL}/api/v1/business/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to update business");
  return json.data as Business;
}
```

---

## 8) Delete a Business (soft delete)

`DELETE /api/v1/business/:id`

```ts
export async function deleteBusiness(id: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/business/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to delete business");
  return true;
}
```

---

## 9) Rendering media in Expo

### Images

```tsx
import { Image } from "react-native";

<Image source={{ uri: item.url }} style={{ width: 200, height: 200 }} />
```

### Videos

Recommended: `expo-av`

```tsx
import { Video } from "expo-av";

<Video
  source={{ uri: item.url }}
  useNativeControls
  resizeMode="contain"
  style={{ width: 320, height: 180 }}
/>
```

---

## 10) Common Issues

- **413 Content Too Large**: you tried to send files inside JSON or a Server Action. Always upload media via `/api/v1/upload` first, then send URLs.
- **Video too long**: server rejects videos longer than ~60 seconds.
- **Cloudinary config missing**: ensure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` exist on server env.
- **Android cleartext error (HTTP on device)**: if using `http://` (local dev), configure Expo/Android network security or use HTTPS tunnel.

