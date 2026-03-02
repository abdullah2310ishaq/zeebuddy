# Google Auth – User App (Expo / React Native) Setup & Troubleshooting

This document explains how the **backend** handles Google sign-in and what the **user app** (Expo / React Native) must configure so Google Auth works. Use it when integrating or debugging **400** / **401** on `POST /api/v1/auth/google`.

---

## 1. Backend Behaviour (What We Do)

### Endpoint

- **User app:** `POST /api/v1/auth/google`
- **Admin panel:** `POST /api/v1/auth/admin/google`

### Request (required)

- **Method:** `POST`
- **Content-Type:** `application/json`
- **Body:** exactly `{ "idToken": "<string>" }`

The `idToken` must be the **Firebase ID token** from Firebase Auth (e.g. from `user.getIdToken()` after signing in with Google via Firebase). It must **not** be:

- The raw Google OAuth **access token**
- A custom JWT from the client
- Empty or missing

### Responses

| Status | Code (in body) | Meaning |
|--------|----------------|--------|
| **200** | — | Success. `data.user`, `data.token` (user app only). |
| **400** | `MISSING_TOKEN` | No `idToken` in body or body not valid JSON. |
| **400** | `INVALID_BODY` | Request body is not valid JSON. |
| **401** | `UNAUTHORIZED` | Token was sent but **invalid or expired**: wrong Firebase project, expired token, or not a Firebase ID token. |
| **403** | `FORBIDDEN` | (Admin only) User exists but is not admin. |

So:

- **400** = backend never got a valid `idToken` (wrong request shape, wrong key, or empty).
- **401** = backend got a string but Firebase rejected it (wrong project, expired, or wrong token type).

---

## 2. What the User App Must Do (Flow)

1. Use the **same Firebase project** as the backend (same project as `FIREBASE_PROJECT_ID` in backend env).
2. In the app: **Google Sign-In** → then **sign in to Firebase Auth** with those credentials → get **Firebase ID token** with `user.getIdToken()` (or `getIdToken(true)` for a fresh token).
3. Call the API:
   - `POST /api/v1/auth/google`
   - Header: `Content-Type: application/json`
   - Body: `JSON.stringify({ idToken: firebaseIdToken })`
4. On success, store `data.token` (and optionally use it as `Authorization: Bearer <token>` for all later requests).

**Critical:** The backend verifies the token with **Firebase Admin** using the **same** Firebase project. If the app uses a different project (e.g. different `google-services.json`), verification fails → **401**.

---

## 3. Why You Might Get 400

Common causes:

| Cause | Fix |
|-------|-----|
| Sending **GET** instead of POST | Use `POST` for `/api/v1/auth/google`. |
| Missing or wrong **Content-Type** | Set `Content-Type: application/json`. |
| Body not JSON | Send body as `JSON.stringify({ idToken: token })`, not form data or query params. |
| Wrong key in body | Key must be **`idToken`** (camelCase). Not `token`, `id_token`, or `accessToken`. |
| **Sending Google access token instead of Firebase ID token** | Get the Firebase user with `signInWithCredential` (Google), then `user.getIdToken()`. Send that string. |
| Empty or null `idToken` | Ensure the string from `getIdToken()` is non-empty before sending. |
| Request body empty or not parsed | Ensure the client actually sends a body; some clients drop body on wrong method or redirect. |

Checking the response body helps: our backend returns `code: "MISSING_TOKEN"` or `"INVALID_BODY"` with a message when it returns 400.

---

## 4. Why You Might Get 401

These happen **after** the backend receives a non-empty `idToken` and calls Firebase Admin `verifyIdToken(idToken)`:

| Cause | Fix |
|-------|-----|
| **Different Firebase project** | User app must use the **same** project as the backend. Same `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) from the project that matches backend `FIREBASE_PROJECT_ID`. |
| **Token expired** | Firebase ID tokens are short-lived. Call `user.getIdToken(true)` to force refresh, then send the new token immediately. |
| **Wrong token type** | Send the **Firebase** ID token from `user.getIdToken()`, not the Google OAuth access token or any other JWT. |
| **Backend env missing** | Backend needs `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (service account). If missing, backend may throw before returning; ensure env is set in the environment that serves the API. |

---

## 5. Firebase Console Configuration (Same Project)

Do this in the **same** Firebase project the backend uses:

1. **Enable Google sign-in**
   - Firebase Console → Authentication → Sign-in method → Google → Enable.

2. **Android app (if you have Android)**
   - Add Android app or use existing.
   - Package name must match your app (e.g. `com.yourapp.name`).
   - Download **google-services.json** and place it in the user app (see below).
   - Add **SHA-1** (and SHA-256) for debug and release:
     - Debug: `keytool -keystore ~/.android/debug.keystore -list -v` (password often `android`).
     - Release: from your release keystore or from Play Console (App signing).
   - Without correct SHA-1, Google Sign-In can fail on Android (e.g. “Developer Error” 10).

3. **iOS app (if you have iOS)**
   - Add iOS app or use existing.
   - Bundle ID must match (e.g. `com.yourapp.name`).
   - Download **GoogleService-Info.plist** and add to the user app.
   - For Expo: often need a custom URL scheme (reversed client ID) for Google Sign-In; see Expo docs.

4. **One project everywhere**
   - Backend: env vars point to this project’s service account.
   - User app: use **only** the `google-services.json` and `GoogleService-Info.plist` from this project.

---

## 6. User App Configuration (Expo)

### 6.1 Same Firebase project

- Get **google-services.json** (Android) and **GoogleService-Info.plist** (iOS) from the **same** Firebase project as the backend.
- Do **not** use a different project for the app (e.g. “dev” app project while backend uses “prod” project) or you will get 401.

### 6.2 app.json / app.config.js (Expo)

- **Android:** point to your Firebase config file, e.g.:
  - `"googleServicesFile": "./google-services.json"` under `expo.android`.
- **iOS:** point to plist, e.g.:
  - `"googleServicesFile": "./GoogleService-Info.plist"` under `expo.ios`.

Example (minimal):

```json
{
  "expo": {
    "android": {
      "package": "com.yourapp.name",
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "bundleIdentifier": "com.yourapp.name",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "plugins": [
      "@react-native-google-signin/google-signin"
    ]
  }
}
```

- **Google Sign-In plugin:** If you use `@react-native-google-signin/google-signin`, add the plugin as above. For iOS you may need to pass `iosUrlScheme` (reversed client ID from `GoogleService-Info.plist`). See [Expo – Google authentication](https://docs.expo.dev/guides/google-authentication) and [React Native Google Sign-In – Expo](https://react-native-google-signin.github.io/docs/setting-up/expo).
- **Development build:** Google Sign-In with native modules typically requires a **development build** (`expo prebuild` + `expo run:ios` / `expo run:android`), not Expo Go.

### 6.3 Getting the Firebase ID token (flow)

1. User taps “Sign in with Google”.
2. Use your chosen method to get Google credentials (e.g. `@react-native-google-signin/google-signin` or Expo AuthSession).
3. **Sign in to Firebase** with those credentials, e.g.:
   - `signInWithCredential(auth, OAuthProvider.credential(idToken, accessToken))` (Firebase JS v9+).
4. From the signed-in Firebase user: `const idToken = await user.getIdToken(true);`
5. Send to backend:
   - `fetch(API_BASE + '/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) })`.

If you send the **Google** `idToken`/`accessToken` to Firebase and then take the **Firebase** `user.getIdToken()`, that’s the correct token. Sending the raw Google OAuth token to our backend will result in **401**.

---

## 7. Backend Checklist (Our Side)

- [ ] Env set: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (same project as user app config files).
- [ ] `POST /api/v1/auth/google` accepts only JSON body with key **`idToken`**.
- [ ] 400 with `MISSING_TOKEN` or `INVALID_BODY` when body is missing or invalid.
- [ ] 401 when Firebase rejects the token (wrong project, expired, or not a Firebase ID token).

---

## 8. Quick Debug (User App)

1. **Log what you send**
   - Method: `POST`
   - URL: `https://your-api/api/v1/auth/google`
   - Headers: `Content-Type: application/json`
   - Body: `{ "idToken": "<your token>" }` (ensure key is `idToken` and value is the Firebase ID token string).

2. **Inspect API response**
   - 400 + `MISSING_TOKEN` or `INVALID_BODY` → fix request shape and key.
   - 401 → fix token: same Firebase project, fresh `getIdToken(true)`, and ensure it’s the Firebase ID token.

3. **Verify Firebase project**
   - In `google-services.json` (Android): `project_id` must equal backend `FIREBASE_PROJECT_ID`.
   - In `GoogleService-Info.plist` (iOS): `PROJECT_ID` same value.

4. **Android “Developer Error” / 10**
   - Add correct SHA-1 (and SHA-256) in Firebase Console for the Android app and ensure package name matches.

This document is the single place for backend behaviour, 400/401 meaning, and what the developer must configure on the **user side** (Expo, Firebase, and request format) for Google Auth to work.
