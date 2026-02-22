# Sign-In Flow Documentation

## Overview

This document describes the complete sign-in flow implementation using Clerk with email/password verification followed by email code (OTP) verification for enhanced security.

## Flow Diagram

```
1. User enters email + password
   ↓
2. Verify credentials with server action (verifyCredentials)
   ↓
3. If valid, create Clerk sign-in with email ONLY
   ↓
4. Send email code to user's email
   ↓
5. Show OTP verification screen
   ↓
6. User enters OTP code from email
   ↓
7. Verify OTP with Clerk
   ↓
8. Complete sign-in & set active session
   ↓
9. Redirect to dashboard
```

## Implementation Details

### Step 1-2: Server-Side Password Verification

**File:** `src/actions/auth.ts`

```typescript
export async function verifyCredentials(email: string, password: string)
```

**Purpose:** 
- Validates email and password with Clerk's backend API
- Uses Clerk's `verify_password` endpoint
- Does NOT create a session or sign the user in
- Returns success/failure

**Process:**
1. Validates input (email format, required fields)
2. Fetches user from Clerk by email
3. Checks if password authentication is enabled
4. Verifies password using Clerk's API: `POST /v1/users/{userId}/verify_password`
5. Returns result

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  userId?: string;
}
```

### Step 3-5: Email Code Initiation

**File:** `src/app/auth/sign-in/page.tsx`

**Process:**
1. After password is verified, create sign-in with email ONLY (no password)
2. This allows email_code to be available as a first factor
3. Find the email code factor
4. Send email code to user's email
5. Show OTP verification screen

**Code:**
```typescript
// Step 1: Verify email and password credentials using server action
const result = await verifyCredentials(email, password);

if (!result.success) {
  setError(result.message);
  return;
}

// Step 2: Credentials verified! Create sign-in with email ONLY (no password)
// This allows email_code to be available as a first factor
await signIn.create({
  identifier: email,
});

// Step 3: Find email code factor
const emailCodeFactor = signIn.supportedFirstFactors?.find(
  (factor: any) => factor.strategy === 'email_code'
) as any;

if (!emailCodeFactor) {
  setError('Email verification is not available. Please contact support.');
  return;
}

// Step 4: Send email code (only reached if password is correct)
await signIn.prepareFirstFactor({
  strategy: 'email_code',
  emailAddressId: emailCodeFactor?.emailAddressId,
});

// Step 5: Show OTP screen
setShowOTP(true);
```

**Important:** 
- Password verification happens on the server first
- If password is wrong, email code is NOT sent
- Sign-in is created with email only (no password) to enable email_code factor
- After calling `signIn.create()`, the sign-in state is stored in the `signIn` object
- All subsequent operations are performed on the `signIn` object

### Step 6-9: OTP Verification

**Process:**
1. User enters the 6-digit OTP code
2. Call `signIn.attemptFirstFactor()` with the code
3. Verify the sign-in status is 'complete'
4. Call `setActive()` to activate the session
5. Redirect to dashboard

**Code:**
```typescript
const completeSignIn = await signIn.attemptFirstFactor({
  strategy: 'email_code',
  code: otp,
});

if (completeSignIn.status === 'complete') {
  await setActive({ session: completeSignIn.createdSessionId });
  router.push('/dashboard');
}
```

## Additional Features

### Resend OTP

Users can request a new OTP code if they didn't receive it or it expired:

```typescript
const handleResendOTP = async () => {
  const emailCodeFactor = signIn.supportedFirstFactors?.find(
    (factor: any) => factor.strategy === 'email_code'
  ) as any;
  
  await signIn.prepareFirstFactor({
    strategy: 'email_code',
    emailAddressId: emailCodeFactor?.emailAddressId,
  });
};
```

### Wrong Email

Users can go back to enter a different email address:

```typescript
const handleWrongEmail = () => {
  setShowOTP(false);
  setError('');
};
```

## Security Features

1. **Two-Step Verification**: Password verification + Email code (OTP)
2. **Server-Side Validation**: Initial password check happens on server
3. **Email Code Verification**: One-time code sent to verified email address
4. **Clerk Session Management**: Secure session handling with industry-standard encryption
5. **Error Handling**: Generic error messages to prevent user enumeration
6. **Input Validation**: Email format and password validation
7. **Time-Limited Codes**: OTP codes expire after a short period
8. **Separate Verification**: Password check happens before sending OTP to prevent spam

## Error Handling

The implementation handles various error scenarios:

- Invalid email format
- User not found in system
- Invalid password
- Password authentication not enabled
- Email verification not available
- Invalid OTP code
- Expired OTP code
- Network errors
- Sign-in session issues

All errors are displayed in a user-friendly error banner with clear messaging.

## UI/UX Features

1. **Loading States**: Button shows "Verifying..." during credential check
2. **Disabled States**: All buttons disabled during loading to prevent duplicate requests
3. **Error Display**: Clear error messages in styled red banners
4. **Password Toggle**: Show/hide password functionality for better UX
5. **Email Display**: Shows the email address on OTP screen for confirmation
6. **Resend Option**: Clear "Resend" button if code wasn't received
7. **Navigation**: Easy way to go back and change email address
8. **Two-Step Security**: Users know their account is extra secure with password + OTP

## Dependencies

- `@clerk/nextjs` - v6.33.4 or higher
- `next` - v15.5.5
- `react` - v19.1.0

## Environment Setup

Ensure your Clerk instance has:
1. **Email code authentication enabled** as a sign-in method
2. **Email verification enabled** as a first factor
3. **Email templates configured** for OTP delivery in Clerk Dashboard
4. **Test mode enabled** (optional) for development

## Testing the Flow

1. Ensure you have a test user created in Clerk Dashboard with:
   - A verified email address
   - Password authentication enabled
2. Navigate to the sign-in page
3. Enter a valid email address and password
4. Click "Login" button
5. System verifies credentials on the server
6. If valid, an email code is sent to your email
7. Check email inbox for the OTP code (check spam folder if needed)
8. Enter the 6-digit code on the verification screen
9. Should redirect to `/dashboard` on successful sign-in

## Troubleshooting

### "Invalid email or password" error
- Check if user exists in Clerk Dashboard
- Verify the email address is correctly typed
- Ensure password is correct
- Verify password authentication is enabled for the user
- Ensure the user account is active (not suspended)

### OTP not received
- Check spam folder
- Verify email configuration in Clerk Dashboard
- Use the "Resend" button to request a new code

### "Sign-in could not be completed" error
- Check Clerk Dashboard for any configuration issues
- Ensure email verification is properly set up
- Review browser console for detailed error messages

## Future Enhancements

Potential improvements to consider:

1. **Rate Limiting**: Prevent abuse by limiting OTP requests per email/IP
2. **Expiration Timer**: Show countdown timer for OTP expiration
3. **Success Notifications**: Add toast notifications for successful actions
4. **Remember Device**: Option to skip OTP on trusted devices
5. **Social Sign-In**: Add Google, GitHub, etc. as alternative sign-in methods
6. **Biometric Auth**: Support for Face ID/Touch ID on mobile devices
7. **Magic Links**: Alternative passwordless option via email links
8. **Analytics**: Track sign-in success rates and user journey

