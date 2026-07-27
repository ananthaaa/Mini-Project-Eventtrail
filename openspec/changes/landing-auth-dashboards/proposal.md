## Why

CampusPulse currently has no dedicated landing page — users land directly on an in-app home screen that already assumes they are logged in. There is no clear entry point explaining the product, no signup flow, and the login, student, and admin zones all share the same layout shell, making the experience feel undifferentiated. This change introduces a proper public marketing landing page, a full-screen immersive login/signup flow, and fully separated layout shells for the student and admin dashboards.

## What Changes

- **New**: Standalone `LandingPage` at `/` — pure marketing page with hero, feature highlights, and CTAs; no app NavBar or Footer
- **New**: Full-screen immersive `LoginPage` at `/login` — student and admin login, role-switch toggle, links to signup
- **New**: Full-screen immersive `SignupPage` at `/signup` — student self-registration with Name, Email, Password, Student ID fields; admin signup is intentionally hidden (admin accounts are pre-created)
- **New**: `StudentLayout` shell — dedicated layout (nav, sidebar or top nav) wrapping all student-zone routes under `/student/*`
- **New**: `StudentDashboard` at `/student` — personalized welcome, upcoming RSVPs, and recommended events
- **New**: `AdminLayout` shell — dedicated sidebar-based layout wrapping all admin routes under `/admin/*`
- **Modified**: `App.jsx` — routes restructured into three layout groups: public, student, admin
- **Modified**: Existing student routes migrated from `/discover`, `/clubs`, `/profile`, etc. to `/student/events`, `/student/clubs`, `/student/profile`, etc.
- **Modified**: `RoleContext` — signup action added alongside existing login/logout

## Capabilities

### New Capabilities

- `landing-page`: Full-screen public marketing landing page explaining the app with feature highlights and CTAs
- `auth-flow`: Immersive full-screen login and signup pages; student self-registration with Name/Email/Password/Student ID; admin login-only
- `student-dashboard`: Personalized student dashboard with welcome panel, upcoming RSVPs, and recommended events
- `student-shell`: Dedicated layout shell (StudentLayout) for the entire student zone with its own navigation
- `admin-shell`: Dedicated layout shell (AdminLayout) for the entire admin zone, replacing the shared NavBar for admin routes

### Modified Capabilities

- `login`: Login page redesigned — now full-screen immersive styled consistent with landing page, admin signup removed

## Impact

- `src/App.jsx` — primary routing restructure, three layout groups
- `src/pages/Home.jsx` — replaced by `LandingPage.jsx`
- `src/pages/Login.jsx` — redesigned; signup tab added
- `src/pages/SignupPage.jsx` — new file
- `src/pages/student/StudentDashboard.jsx` — new file
- `src/components/layout/StudentLayout.jsx` — new layout shell
- `src/components/layout/AdminLayout.jsx` — new layout shell
- `src/context/RoleContext.jsx` — signup action added
- All existing student page route paths updated (breaking URL change: `/discover` → `/student/events`, etc.)
- No backend changes — all mock data, localStorage-based auth
