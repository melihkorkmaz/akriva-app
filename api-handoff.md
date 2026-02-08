# API Handoff: Authentication Flows

## Business Context

The authentication system handles user registration (with optional invitation-based onboarding), login (with MFA support), token management, and password operations. It uses AWS Cognito as the identity provider behind a serverless API. New users can sign up independently (creating a new tenant/organization) or accept an invitation to join an existing tenant. All endpoints except password change are public (no JWT required). Audit events are reliably captured via a transactional outbox for compliance and observability.

**Key domain terms**:
- **Tenant**: An organization/company account. Each user belongs to exactly one tenant.
- **Invitation**: A pre-created record that allows a new user to join an existing tenant with a specific role.
- **Outbox**: A database table used for reliable event delivery (CDC pattern). Frontend does not interact with this directly.
- **MFA**: Multi-factor authentication via TOTP (authenticator app). When enabled, signin returns a challenge instead of tokens.

## Base URL

```
https://{api-domain}/v1/auth
```

All endpoints use `POST` method. CORS allows all origins with `POST` and `OPTIONS` methods.

---

## Endpoints

### POST /auth/signup

- **Purpose**: Register a new user account, optionally via invitation
- **Auth**: Public (no token required)
- **Request**:
  ```json
  {
    "email": "string — valid email, max 255 chars, required",
    "password": "string — 8-256 chars, required",
    "givenName": "string — 1-255 chars, required",
    "familyName": "string — 1-255 chars, required",
    "companyName": "string — 1-255 chars, required if no invitationToken",
    "invitationToken": "string — UUID format, optional"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "tokens": {
      "accessToken": "string — JWT",
      "idToken": "string — JWT",
      "refreshToken": "string",
      "expiresIn": 3600
    },
    "user": {
      "id": "string — UUID",
      "email": "string",
      "tenantId": "string — UUID",
      "role": "string — 'owner' for new signups, invitation role for invited users"
    }
  }
  ```
- **Response** (error):

  | Status | Code | When |
  |--------|------|------|
  | 400 | `VALIDATION_FAILED` | Zod validation failure (missing/invalid fields) |
  | 400 | `VALIDATION_FAILED` | `companyName` missing when no invitation provided |
  | 400 | `VALIDATION_FAILED` | Invitation expired, already used, or not found |
  | 404 | `NOT_FOUND` | Invitation's tenant no longer exists |
  | 409 | `CONFLICT` | Email already registered |
  | 500 | `MFA_CHALLENGE_REQUIRED` | Unexpected MFA challenge (should not happen for new users) |
  | 500 | `COGNITO_OPERATION_FAILED` | Cognito SDK error |

- **Notes**:
  - **Two signup paths**: (1) New org signup requires `companyName`, creates a new tenant, user becomes `owner`. (2) Invitation signup uses `invitationToken`, user joins existing tenant with the invitation's role.
  - On any failure after partial creation, the backend **rolls back** (deletes user, Cognito entry, tenant) via saga compensation. Frontend does not need to handle partial states.
  - The user is automatically authenticated — tokens are returned directly (no separate signin needed).
  - Invitation is marked as `accepted` upon successful signup.

---

### POST /auth/signin

- **Purpose**: Authenticate with email and password
- **Auth**: Public
- **Request**:
  ```json
  {
    "email": "string — valid email, max 255 chars, required",
    "password": "string — 8-256 chars, required"
  }
  ```
- **Response** (200 OK) — **two possible shapes based on `type` field**:

  **A. Normal authentication** (`type: "tokens"`):
  ```json
  {
    "type": "tokens",
    "tokens": {
      "accessToken": "string — JWT",
      "idToken": "string — JWT",
      "refreshToken": "string",
      "expiresIn": 3600
    }
  }
  ```

  **B. MFA challenge required** (`type: "mfa_challenge"`):
  ```json
  {
    "type": "mfa_challenge",
    "challenge": {
      "challengeName": "SOFTWARE_TOKEN_MFA",
      "session": "string — opaque session token, pass to /auth/mfa/verify",
      "challengeParameters": {}
    }
  }
  ```

- **Response** (error):

  | Status | Code | When |
  |--------|------|------|
  | 400 | `VALIDATION_FAILED` | Invalid input |
  | 401 | `UNAUTHORIZED` | Wrong email or password |
  | 500 | `COGNITO_OPERATION_FAILED` | Cognito SDK error |

- **Notes**:
  - Frontend **must** check `response.type` to determine if tokens were returned or an MFA challenge is needed.
  - The `session` token in MFA challenge is short-lived. Prompt user for TOTP code promptly.
  - Error message for 401 is always `"Invalid email or password"` (no distinction between wrong email vs wrong password).

---

### POST /auth/mfa/verify

- **Purpose**: Complete MFA challenge with TOTP code from authenticator app
- **Auth**: Public
- **Request**:
  ```json
  {
    "session": "string — session token from signin MFA challenge response, required",
    "code": "string — 6-digit TOTP code, required"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "accessToken": "string — JWT",
    "idToken": "string — JWT",
    "refreshToken": "string",
    "expiresIn": 3600
  }
  ```
- **Response** (error):

  | Status | Code | When |
  |--------|------|------|
  | 400 | `VALIDATION_FAILED` | Invalid input |
  | 401 | `UNAUTHORIZED` | Wrong MFA code |
  | 500 | `COGNITO_OPERATION_FAILED` | Cognito SDK error |

- **Notes**:
  - The `session` token expires quickly. If user takes too long, they must re-signin to get a fresh challenge.
  - Response shape is **flat tokens** (not wrapped in `{ type, tokens }`), unlike the signin response.

---

### POST /auth/refresh

- **Purpose**: Get new access/ID tokens using a refresh token
- **Auth**: Public
- **Request**:
  ```json
  {
    "refreshToken": "string — non-empty, required"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "accessToken": "string — JWT",
    "idToken": "string — JWT",
    "refreshToken": "string — same value as input (not rotated)",
    "expiresIn": 3600
  }
  ```
- **Response** (error):

  | Status | Code | When |
  |--------|------|------|
  | 400 | `VALIDATION_FAILED` | Invalid input |
  | 401 | `UNAUTHORIZED` | Invalid or expired refresh token |
  | 500 | `COGNITO_OPERATION_FAILED` | Cognito SDK error |

- **Notes**:
  - **Refresh token is NOT rotated**. The same refresh token is returned. Store it once and reuse until it expires.
  - When a 401 is returned, the user's session is expired — redirect to login.

---

### POST /auth/forgot-password

- **Purpose**: Request a password reset code (sent to email by Cognito)
- **Auth**: Public
- **Request**:
  ```json
  {
    "email": "string — valid email, max 255 chars, required"
  }
  ```
- **Response** (200 OK) — **always returns 200**:
  ```json
  {
    "message": "If the email exists, a reset code has been sent"
  }
  ```
- **Response** (error): **None** — always returns 200 to prevent user enumeration.

- **Notes**:
  - This endpoint **always returns 200** with the same message, whether the email exists or not. This is intentional to prevent attackers from discovering valid accounts.
  - If the email exists, Cognito sends a 6-digit verification code to the user's email.
  - Frontend should show the same UI regardless of response — prompt user to check email and enter the code.

---

### POST /auth/confirm-forgot-password

- **Purpose**: Reset password using the verification code from email
- **Auth**: Public
- **Request**:
  ```json
  {
    "email": "string — valid email, max 255 chars, required",
    "confirmationCode": "string — 6-digit code from email, required",
    "newPassword": "string — 8-256 chars, required"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "Password has been reset successfully"
  }
  ```
- **Response** (error):

  | Status | Code | When |
  |--------|------|------|
  | 400 | `VALIDATION_FAILED` | Invalid input, wrong code, expired code, or password policy violation |
  | 500 | `COGNITO_OPERATION_FAILED` | Cognito SDK error |

- **Notes**:
  - Three distinct 400 errors with different messages:
    - `"Invalid confirmation code"` — wrong code entered
    - `"Confirmation code has expired"` — code timed out, user must request a new one via `/forgot-password`
    - Dynamic Cognito message — password doesn't meet policy (e.g., too short, no uppercase)
  - After successful reset, user must sign in again with the new password. No tokens are returned.

---

### POST /auth/change-password

- **Purpose**: Change password for the currently authenticated user
- **Auth**: **JWT required** — Bearer token in `Authorization` header
- **Request Headers**:
  ```
  Authorization: Bearer {accessToken}
  ```
- **Request**:
  ```json
  {
    "previousPassword": "string — 8-256 chars, required",
    "proposedPassword": "string — 8-256 chars, required"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "Password changed successfully"
  }
  ```
- **Response** (error):

  | Status | Code | When |
  |--------|------|------|
  | 400 | `VALIDATION_FAILED` | Invalid input or password policy violation |
  | 401 | `UNAUTHORIZED` | Missing/invalid auth header OR wrong current password |
  | 500 | `COGNITO_OPERATION_FAILED` | Cognito SDK error |

- **Notes**:
  - This is the **only authenticated endpoint** in the auth domain.
  - The 401 for wrong current password returns `"Invalid email or password"` (same generic message as signin).
  - Missing `Authorization` header returns `{ "error": "Missing or invalid Authorization header" }`.

---

## Data Models / DTOs

```typescript
/** Returned by signup */
interface SignupResponse {
  tokens: AuthTokens;
  user: {
    id: string;
    email: string;
    tenantId: string;
    role: 'owner' | 'admin' | 'user';
  };
}

/** Returned by signin (discriminated union) */
type SigninResponse =
  | { type: 'tokens'; tokens: AuthTokens }
  | { type: 'mfa_challenge'; challenge: MfaChallenge };

/** Shared token shape */
interface AuthTokens {
  accessToken: string;   // JWT — use for Authorization header
  idToken: string;       // JWT — contains user claims
  refreshToken: string;  // Opaque — use for token refresh
  expiresIn: number;     // Seconds until accessToken expires (typically 3600)
}

/** MFA challenge from signin */
interface MfaChallenge {
  challengeName: string;                    // e.g., "SOFTWARE_TOKEN_MFA"
  session: string;                          // Pass to /auth/mfa/verify
  challengeParameters: Record<string, string>;
}

/** Standard error response */
interface ErrorResponse {
  error: string;         // Human-readable message
  code: string;          // Machine-readable code
  details?: {            // Present for Zod validation errors
    issues: Array<{
      code: string;
      path: string[];
      message: string;
      [key: string]: unknown;
    }>;
  };
}
```

### JWT Claims (from `idToken`)

The `idToken` JWT contains these custom claims for frontend use:

```typescript
interface JwtCustomClaims {
  sub: string;                    // Cognito user sub (UUID)
  email: string;
  given_name: string;
  family_name: string;
  'custom:tenant_id': string;    // UUID — snake_case, NOT camelCase
  'custom:user_id': string;      // UUID
  'custom:tenant_role': string;  // 'owner' | 'admin' | 'user'
}
```

> **Important**: Custom claim keys use **snake_case** with `custom:` prefix (e.g., `custom:tenant_id`, NOT `custom:tenantId`).

---

## Enums & Constants

| Value | Context | Meaning | Display Label |
|-------|---------|---------|---------------|
| `owner` | User role | Tenant creator, full admin | Owner |
| `admin` | User role | Tenant administrator | Admin |
| `user` | User role | Regular team member | Member |
| `init` | Tenant status | Just created during signup | Initializing |
| `active` | Tenant status | Fully operational | Active |
| `suspended` | Tenant status | Disabled by admin | Suspended |
| `pending` | Invitation status | Awaiting signup | Pending |
| `accepted` | Invitation status | Used in signup | Accepted |
| `expired` | Invitation status | Past expiry date | Expired |

### Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `VALIDATION_FAILED` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Authentication failed |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate resource |
| `MFA_CHALLENGE_REQUIRED` | 500 | Unexpected MFA during signup |
| `COGNITO_OPERATION_FAILED` | 500 | AWS Cognito service error |

---

## Validation Rules

Frontend should mirror these for immediate UX feedback:

| Field | Rules |
|-------|-------|
| `email` | Required, valid email format, max 255 chars |
| `password` / `previousPassword` / `proposedPassword` / `newPassword` | Required, 8-256 characters |
| `givenName` | Required, 1-255 characters |
| `familyName` | Required, 1-255 characters |
| `companyName` | 1-255 characters; **required if no `invitationToken`** |
| `invitationToken` | UUID format (optional) |
| `confirmationCode` | Non-empty string (typically 6 digits) |
| `refreshToken` | Non-empty string |
| `session` (MFA) | Non-empty string |
| `code` (MFA) | Non-empty string (6-digit TOTP) |

### Conditional Validation

- `companyName` is **required** when `invitationToken` is not provided (new org signup)
- `companyName` is **ignored** when `invitationToken` is provided (invitation signup)

### Password Policy

The password validation is 8-256 chars on the API side. Cognito may enforce additional rules (uppercase, lowercase, numbers, special characters) that will surface as `VALIDATION_FAILED` with the Cognito-provided message. Frontend should display the server error message for password policy violations.

---

## Business Logic & Edge Cases

- **Two signup flows**: New org signup (with `companyName`) creates a tenant + user. Invitation signup (with `invitationToken`) joins an existing tenant. These are mutually exclusive paths determined by the presence of `invitationToken`.
- **Signin has two response shapes**: Check `response.type` — `"tokens"` means success, `"mfa_challenge"` means the user has MFA enabled and must complete verification.
- **MFA verify response is flat**: Unlike signin, the MFA verify endpoint returns tokens directly (not wrapped in `{ type: "tokens", tokens: {...} }`).
- **Forgot password never fails**: Always returns 200 to prevent user enumeration. Show the same "check your email" UI regardless.
- **Refresh token is not rotated**: Store it once, reuse until 401. On 401, redirect to login.
- **Change password is the only authenticated endpoint**: All other auth endpoints are public.
- **Invitation expiry**: Invitations have an optional `expiresAt`. An expired or already-accepted invitation returns 400 during signup.
- **Email uniqueness**: Checked at signup time. The 409 error means an account with that email already exists.
- **Cognito errors are opaque**: 500 errors from Cognito include an operation name but not actionable details for the user. Show a generic "Something went wrong, please try again" message.

---

## Integration Notes

- **Recommended signup flow**:
  1. Show signup form (email, password, names, company name)
  2. If URL contains invitation token, hide company name field and pass token
  3. On success, store all three tokens and navigate to dashboard
  4. On 409, show "email already exists" — link to signin

- **Recommended signin flow**:
  1. Show email/password form
  2. On success with `type: "tokens"`, store tokens and navigate
  3. On success with `type: "mfa_challenge"`, show TOTP code input
  4. Submit code to `/auth/mfa/verify`, store tokens on success
  5. On 401, show "Invalid email or password"

- **Recommended password reset flow**:
  1. Show email input form
  2. Submit to `/auth/forgot-password`
  3. Always show "Check your email" page (don't leak whether email exists)
  4. Show code + new password form
  5. Submit to `/auth/confirm-forgot-password`
  6. On success, redirect to signin

- **Token storage**: Store `accessToken`, `idToken`, and `refreshToken`. Use `accessToken` in `Authorization: Bearer` header for all authenticated API calls. Use `idToken` to read user claims (tenant, role) client-side. Use `refreshToken` to get new tokens before expiry.

- **Token refresh strategy**: Set up an interceptor that refreshes tokens when `accessToken` is about to expire (check `expiresIn`) or on 401 response. On refresh 401, clear stored tokens and redirect to login.

- **Optimistic UI**: Not applicable for auth flows — always wait for server confirmation.

- **Caching**: No cache headers on auth endpoints. Do not cache auth responses.

---

## Test Scenarios

### Signup

1. **Happy path (new org)**: Valid email + password + names + companyName → 201 with tokens and `role: "owner"`
2. **Happy path (invitation)**: Valid fields + invitationToken → 201 with tokens and invitation's role
3. **Duplicate email**: Existing email → 409 `CONFLICT`
4. **Missing company name**: No invitationToken and no companyName → 400 `VALIDATION_FAILED`
5. **Expired invitation**: Expired or accepted token → 400 `VALIDATION_FAILED`
6. **Invalid invitation token**: Non-UUID string → 400 `VALIDATION_FAILED`
7. **Weak password**: Less than 8 chars → 400 `VALIDATION_FAILED`

### Signin

1. **Happy path**: Correct credentials → 200 with `type: "tokens"`
2. **MFA enabled**: Correct credentials, MFA active → 200 with `type: "mfa_challenge"`
3. **Wrong password**: → 401 `UNAUTHORIZED`
4. **Non-existent email**: → 401 `UNAUTHORIZED` (same message as wrong password)
5. **Empty fields**: → 400 `VALIDATION_FAILED`

### MFA Verify

1. **Happy path**: Valid session + correct code → 200 with tokens
2. **Wrong code**: → 401 `UNAUTHORIZED`
3. **Expired session**: → 401 `UNAUTHORIZED` (user must re-signin)

### Token Refresh

1. **Happy path**: Valid refresh token → 200 with new access/ID tokens
2. **Expired/invalid token**: → 401 `UNAUTHORIZED`

### Forgot Password

1. **Existing email**: → 200 (code sent)
2. **Non-existent email**: → 200 (same response, no code sent)

### Confirm Forgot Password

1. **Happy path**: Correct code + valid password → 200 success
2. **Wrong code**: → 400 `VALIDATION_FAILED` "Invalid confirmation code"
3. **Expired code**: → 400 `VALIDATION_FAILED` "Confirmation code has expired"
4. **Weak new password**: → 400 `VALIDATION_FAILED` (Cognito policy message)

### Change Password

1. **Happy path**: Valid auth + correct current password + valid new password → 200
2. **Wrong current password**: → 401 `UNAUTHORIZED`
3. **Missing auth header**: → 401 `UNAUTHORIZED`
4. **Weak new password**: → 400 `VALIDATION_FAILED`

---

## Open Questions / TODOs

- **MFA setup flow**: There is currently no endpoint for enabling/configuring MFA (TOTP setup, QR code generation). This will need to be added when MFA onboarding is implemented.
- **Logout endpoint**: `user.logout` event type is defined but no logout endpoint exists yet. Frontend can clear tokens client-side, but server-side token revocation (Cognito `GlobalSignOut`/`AdminUserGlobalSignOut`) is not implemented.
- **Rate limiting**: No explicit rate limiting is configured on auth endpoints. API Gateway throttling may apply at the account level.
- **CORS**: Currently allows all origins (`*`). This should be restricted to specific frontend domains before production.
