# Module 2 — Auth (Cognito)

**Status:** 🟢 **DONE** (Fully verified against live AWS environment in `ap-south-1`)
**Date:** 2026-07-27

---

## 1. What Was Built

AWS Cognito authentication was fully implemented, deployed, and tested end-to-end for EventTrail. This module replaced the app's dummy role toggle (`RoleContext` switch) with a real, JWT-secured authentication layer backed by AWS Cognito and API Gateway.

- **Cognito User Pool** provisioned with email-alias sign-in support, custom user attributes (`custom:role`, `custom:clubId`, `custom:facultyId`), and a strict password policy (min. 8 chars).
- **Two Cognito Groups** (`student`, `admin`) created for role-based access control; JWT tokens carry `cognito:groups` claims that the frontend reads to determine routing.
- **Post-Confirmation Lambda** (`PostConfirmationTrigger`) deployed and wired to the User Pool. Fires on both `PostConfirmation_ConfirmSignUp` and `PostAuthentication_Authentication` events, automatically inserting a matching profile row into `EventTrail-Users-dev` DynamoDB table on every sign-up and first login.
- **Cognito App Client** (`EventTrailAppClient-dev`) configured with SRP, Custom, User Password, and Admin User Password auth flows.
- **API Gateway HTTP API** (`EventTrail-HttpApi-dev`) deployed with a JWT Authorizer pointing at the User Pool issuer. A protected throwaway test route (`GET /whoami`) was added to prove token acceptance/rejection by group.
- **Frontend Service** (`src/services/authService.js`) built using `amazon-cognito-identity-js` for sign-up, OTP confirmation, sign-in, sign-out, session refresh, and JWT validation.
- **RoleContext** (`src/context/RoleContext.jsx`) wired to real Cognito session state with an offline "Quick Demo" fallback for UI development without network access.
- **Login page** (`src/pages/Login.jsx`) updated to call real Cognito sign-in with error handling and demo fallback.
- **Signup page** (`src/pages/SignupPage.jsx`) updated with a two-step flow: registration → OTP email verification → auto login.
- **Student Profile page** (`src/pages/StudentProfile.jsx`) updated with an interactive JWT Verification panel that calls `/whoami` live from the browser.
- **Automated E2E Test Script** (`src/scripts/testAuth.js`) created and executed (`npm run test:auth`) — programmatically creates student/admin users, authenticates them, verifies DynamoDB auto-population, and confirms JWT authorizer behavior.

---

## 2. AWS Resources Created

| Resource Type | Resource Name / Identifier | Purpose |
|---|---|---|
| **Cognito User Pool** | `EventTrailUserPool-dev` (`ap-south-1_jp3Rdi0UU`) | Central identity store for all students and admins. Email configured as sign-in alias. |
| **Cognito User Pool Client** | `EventTrail-AppClient-dev` (`7tliavfpsko0ugfrkidm8lj2te`) | Frontend app client. Supports SRP, User Password, and Admin User Password flows. |
| **Cognito User Pool Group** | `student` | Default group for all registered students. JWT carries `"cognito:groups": ["student"]`. |
| **Cognito User Pool Group** | `admin` | Group for club and platform administrators. JWT carries `"cognito:groups": ["admin"]`. |
| **Lambda Function** | `PostConfirmationTrigger` | Fires on sign-up confirmation and login. Inserts user profile into DynamoDB `EventTrail-Users-dev`. |
| **Lambda Permission** | `PostAuthenticationCognito` | IAM permission allowing Cognito to invoke the trigger on `PostAuthentication` events. |
| **Lambda Function** | `WhoAmILambda` | Test handler behind the protected `/whoami` route. Returns JWT claims and user group. |
| **API Gateway HTTP API** | `EventTrail-HttpApi-dev` | HTTP API Gateway (`https://k1f5xsammd.execute-api.ap-south-1.amazonaws.com/`). |
| **API Gateway JWT Authorizer** | `CognitoAuthorizer` | Validates Cognito ID tokens against the User Pool issuer before routing to Lambda. |
| **API Gateway Route** | `GET /whoami` | Protected test route; returns `{ status: "authenticated", user: { email, groups, sub } }`. |

---

## 3. API Endpoints Added

| Method | Path | Auth Required | Lambda | Description |
|---|---|---|---|---|
| `GET` | `/whoami` | ✅ JWT (Cognito) | `WhoAmILambda` | Test endpoint to verify JWT claims and group membership. Returns 401 for unauthenticated requests. |

---

## 4. Frontend Files Touched

| File | Change |
|---|---|
| `src/services/authService.js` | **NEW** — Cognito SDK wrapper for sign-up, OTP confirm, sign-in, sign-out, session restore, and `/whoami` test. |
| `src/context/RoleContext.jsx` | **MODIFIED** — Replaced mock role toggle with real Cognito session state, `signup()`, `confirmSignup()`, `login()`, `logout()`, and `testWhoAmI()`. |
| `src/pages/Login.jsx` | **MODIFIED** — Real Cognito authentication with error handling and offline Quick Demo fallback. Fixed JSX fragment closure bug. |
| `src/pages/SignupPage.jsx` | **MODIFIED** — Two-step sign-up flow: registration form → OTP email code → auto login. Stores Cognito generated `username` for OTP confirmation (not email). |
| `src/pages/StudentProfile.jsx` | **MODIFIED** — Added live JWT verification panel; calls `/whoami` with active ID token and displays response in the UI. |
| `src/scripts/testAuth.js` | **NEW** — Automated end-to-end verification script (`npm run test:auth`). |
| `vite.config.js` | **MODIFIED** — Set `base: '/'`, added `global: 'globalThis'` polyfill for `amazon-cognito-identity-js` browser compatibility. |

---

## 5. Key Decisions & Deviations

1. **Username ≠ Email for Sign-Up**: The Cognito User Pool uses email as a *sign-in alias*. This means Cognito **rejects email-format strings as the `Username`** field during `signUp()`. The solution is to generate a unique random username (`user_<timestamp>_<random>`) during registration; sign-in still uses email via the alias. This is documented in `authService.js`.

2. **Dual Lambda Trigger (PostConfirmation + PostAuthentication)**: The Post-Confirmation trigger fires when a user confirms via OTP. However, users created via `AdminCreateUser` (e.g. during automated tests) skip OTP and only trigger `PostAuthentication`. Both trigger sources were added to ensure DynamoDB is always populated regardless of how a user account was created.

3. **Admin User Password Auth Flow**: The `ADMIN_USER_PASSWORD_AUTH` flow was added to the App Client to enable the automated test script to authenticate server-side without a browser. This flow requires AWS credentials with `cognito-idp:AdminInitiateAuth` permission.

4. **Offline Demo Mode Preserved**: Every auth function falls back gracefully to a mock session when Cognito credentials are unavailable. This lets the team continue UI development even without an internet connection or real AWS credentials.

5. **`global` Polyfill**: `amazon-cognito-identity-js` internally references Node.js `global`, which does not exist in browser environments. Fixed by adding `define: { global: 'globalThis' }` to `vite.config.js`.

---

## 6. How to Verify It Works

### A. Run Automated End-to-End Verification Script

```bash
# From the project root (requires AWS credentials in environment)
npm run test:auth
```

This script:
1. Creates a student and admin user in Cognito via `AdminCreateUser`.
2. Authenticates both via `AdminInitiateAuth` to obtain JWT ID Tokens.
3. Verifies DynamoDB `EventTrail-Users-dev` was auto-populated by the Lambda trigger.
4. Sends an unauthenticated request to `/whoami` and confirms HTTP 401.
5. Sends authenticated requests with student and admin JWTs and confirms correct group claims.
6. Cleans up all test users.

### B. Manual Browser Flow

1. Open `http://localhost:5173/signup`.
2. Fill in Name, Campus Email, Student ID, and Password (min. 8 chars).
3. Click **Create Account** — you will be redirected to an OTP verification screen.
4. Check your email inbox for the 6-digit code from AWS Cognito.
5. Enter the code and click **Verify & Login** — you are automatically logged in and redirected to `/student`.
6. Navigate to `/profile` → click **Test /whoami Route** to see your live JWT claims returned from API Gateway.

### C. Check AWS Console

| Console | What to verify |
|---|---|
| [Cognito → User Pools](https://ap-south-1.console.aws.amazon.com/cognito/v2/idp/user-pools?region=ap-south-1) | New user appears after sign-up; group membership is `student` |
| [DynamoDB → EventTrail-Users-dev](https://ap-south-1.console.aws.amazon.com/dynamodbv2/home?region=ap-south-1#item-explorer?table=EventTrail-Users-dev) | Item auto-inserted by Lambda trigger with `id`, `email`, `role`, `avatar` |
| [CloudWatch → Lambda Logs](https://ap-south-1.console.aws.amazon.com/cloudwatch/home?region=ap-south-1#logsV2:log-groups) | Filter by `/aws/lambda/PostConfirmationTrigger` to see trigger execution logs |

---

## 7. Verification Checklist

- [x] **Cognito User Pool + Groups deployed**: `CampusPulse-Auth-dev` stack created successfully (Stack ARN: `arn:aws:cloudformation:ap-south-1:742020475364:stack/CampusPulse-Auth-dev/2398f300-89dd-11f1-bc43-06ba0f41663f`).
- [x] **Student sign-up via browser works**: Form → OTP email → verify → auto login (confirmed locally at `http://localhost:5173/signup`).
- [x] **DynamoDB auto-population confirmed**: Lambda trigger fires on `PostAuthentication_Authentication`; student and admin profile items appear in `EventTrail-Users-dev` table automatically.
- [x] **JWT Authorizer rejects unauthenticated calls**: `GET /whoami` without token returns **HTTP 401 Unauthorized**.
- [x] **Student JWT accepted with correct group claim**: `/whoami` returns `{ status: "authenticated", user: { groups: ["student"] } }`.
- [x] **Admin JWT accepted with correct group claim**: `/whoami` returns `{ status: "authenticated", user: { groups: ["admin"] } }`.
- [x] **RoleContext uses real Cognito session state**: Role-based navigation works for both student and admin paths; session persists across page refreshes.
- [x] **Offline demo mode preserved**: Quick Demo Login/Signup buttons work without AWS credentials.
- [x] **Automated test passes 100%**: `npm run test:auth` exits with code 0 — all 5 steps verified.
- [x] **Default admin account provisioned**: `npm run create:admin` completed successfully. Admin account active in Cognito and DynamoDB.
- [x] **Quick Admin Login button works**: Admin tab on Login page includes one-click login using pre-seeded Cognito credentials.

---

## 8. Addendum — Default Admin User Setup

> **Added:** 2026-07-27 | **Commit:** `4a3050e`

### Why a Default Admin?

Student accounts are self-registered through the signup page. Admin accounts, however, must be **pre-provisioned by a developer** — an admin cannot sign themselves up through the public form. This design prevents unauthorized users from obtaining admin-level JWT group claims.

### How It Was Done

A one-time provisioning script (`src/scripts/createAdminUser.js`) was created that:

1. Reads admin credentials from `.env.local` (never committed to git)
2. Creates the admin user in Cognito with `AdminCreateUser` using a generated plain username (`admin_default_<sanitized_email>`)
3. Sets a **permanent password** immediately with `AdminSetUserPasswordCommand` (bypasses the `FORCE_CHANGE_PASSWORD` state that would otherwise block sign-in)
4. Adds the user to the `admin` Cognito group
5. Upserts the admin profile into `EventTrail-Users-dev` DynamoDB (idempotent — safe to re-run without duplicating the record)

### Admin Account Details

| Field | Value |
|---|---|
| **Email** | `admin@eventtrail.dev` |
| **Cognito Username** | `admin_default_admin_eventtrail_dev` |
| **Cognito Sub (ID)** | `b173fd5a-8001-7019-d8ff-97114209d985` |
| **Cognito Group** | `admin` |
| **DynamoDB Table** | `EventTrail-Users-dev` |
| **DynamoDB Key** | `id = b173fd5a-8001-7019-d8ff-97114209d985` |
| **Password stored in** | `.env.local` as `ADMIN_PASSWORD` (not committed to git) |

> [!CAUTION]
> The admin password is stored **only** in `.env.local` which is gitignored. Never commit `.env.local` to version control. Share admin credentials with team members via a secure password manager.

### Environment Variables Required

Add these to your `.env.local` (see `.env.example` for the full template):

```env
# Used by: npm run create:admin (server-side, Node.js only)
ADMIN_EMAIL=admin@eventtrail.dev
ADMIN_PASSWORD=Admin@EventTrail123!
ADMIN_NAME=Platform Admin

# Used by: Quick Admin Login button in Login.jsx (browser, dev only)
VITE_ADMIN_EMAIL=admin@eventtrail.dev
VITE_ADMIN_PASSWORD=Admin@EventTrail123!
```

### How to Provision the Admin (First-Time Setup)

```bash
# 1. Ensure .env.local has ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME set
# 2. Run from the project root:
npm run create:admin
```

The script is **idempotent** — if the admin already exists in Cognito it will skip creation and only update the group membership and DynamoDB record.

### How to Log in as Admin

**Option A — Quick Admin Login button (recommended for dev):**
1. Open `http://localhost:5173/login`
2. Click the **Admin** tab
3. Click the green **"Quick Admin Login (Real Cognito)"** button
4. You are automatically signed in and redirected to `/admin`

**Option B — Manual credentials:**
1. Open `http://localhost:5173/login`
2. Click the **Admin** tab
3. Enter Email: `admin@eventtrail.dev`
4. Enter Password: *(value of `ADMIN_PASSWORD` in `.env.local`)*
5. Click **Sign In**

### Frontend Changes

| File | Change |
|---|---|
| `src/scripts/createAdminUser.js` | **NEW** — One-time admin provisioning script (`npm run create:admin`) |
| `src/pages/Login.jsx` | **MODIFIED** — Added `handleQuickAdminLogin()` function and "Quick Admin Login (Real Cognito)" button visible only on Admin tab when `VITE_ADMIN_EMAIL` is set |
| `package.json` | **MODIFIED** — Added `"create:admin"` script |
| `.env.local` | **MODIFIED** — Added `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `VITE_ADMIN_EMAIL`, `VITE_ADMIN_PASSWORD` |
| `.env.example` | **MODIFIED** — Updated template with admin variable documentation |

### Security Notes

- The `ADMIN_PASSWORD` env var is **never prefixed with `VITE_`** in the server-side script — it is only accessible in the Node.js environment and never bundled into the browser build.
- The `VITE_ADMIN_EMAIL` / `VITE_ADMIN_PASSWORD` variables **are** exposed to the browser bundle, but only for local development convenience. They should be **removed or left blank** before any production deployment.
- In production, admin login should use only the standard credential form — no env-var shortcuts.

