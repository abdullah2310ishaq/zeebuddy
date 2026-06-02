# Expo Guest + User Push Token Integration

This guide adds push registration at app startup so guest users can also receive admin push notifications.

## New API (added)

- `POST /api/v1/push/device-token`
  - Registers device token on app initialize (guest or signed-in user mode).
- `DELETE /api/v1/push/device-token`
  - Disables device token for that installation/platform.

Existing API remains unchanged:

- `POST /api/v1/user/fcm-token` (signed-in user token flow)

Admin push broadcast now supports guest devices as well (enabled by default):

- `POST /api/v1/admin/push-notifications`
  - accepts `includeGuests?: boolean` (default `true`)

## Request Contracts

### 1) Register token on app init

`POST /api/v1/push/device-token`

```json
{
  "installationId": "unique-device-or-install-id",
  "token": "native-fcm-or-apns-token",
  "platform": "android",
  "appMode": "guest"
}
```

iOS example:

```json
{
  "installationId": "unique-device-or-install-id",
  "token": "apns-token",
  "platform": "ios",
  "environment": "production",
  "appMode": "guest"
}
```

### 2) Disable token (logout/opt-out)

`DELETE /api/v1/push/device-token`

```json
{
  "installationId": "unique-device-or-install-id",
  "platform": "android"
}
```

## Expo App Integration

Use startup registration in your root app init.

### Example utility

```ts
import * as Notifications from "expo-notifications";
import * as Application from "expo-application";
import { Platform } from "react-native";

type AppMode = "guest" | "user";

const API_BASE = "https://your-api-domain.com/api/v1";

function getInstallationId(): string {
  return (
    Application.getAndroidId?.() ||
    Application.applicationId ||
    `${Platform.OS}-unknown-installation`
  );
}

export async function registerPushOnAppInit(params: {
  appMode: AppMode;
  authToken?: string;
}) {
  const { appMode, authToken } = params;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  const expoTokenResp = await Notifications.getDevicePushTokenAsync();
  const nativeToken = String(expoTokenResp.data || "").trim();
  if (!nativeToken) return;

  const payload = {
    installationId: getInstallationId(),
    token: nativeToken,
    platform: Platform.OS === "ios" ? "ios" : "android",
    environment: __DEV__ ? "development" : "production",
    appMode,
  };

  await fetch(`${API_BASE}/push/device-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}
```

### When to call

- App startup (before login): `appMode: "guest"`
- After user login: call again with `appMode: "user"` and `Authorization` token
- On logout: either
  - call `DELETE /push/device-token` to disable, or
  - immediately re-register as `guest`

## Notes

- Keep existing `/user/fcm-token` flow for backward compatibility.
- New endpoint is safe for guest mode and user mode both.
- Broadcast notifications now include guest tokens by default (`includeGuests: true`).
