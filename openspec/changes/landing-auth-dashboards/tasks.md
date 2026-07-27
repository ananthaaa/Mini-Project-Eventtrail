## 1. App Structure & Routing

- [x] 1.1 Restructure `App.jsx` — replace single global layout with three layout-grouped route trees: `LandingLayout`, `StudentLayout`, `AdminLayout`
- [x] 1.2 Add redirect routes for old paths (`/discover` → `/student/events`, `/clubs` → `/student/clubs`, `/profile` → `/student/profile`, `/navigate` → `/student/navigate`)
- [x] 1.3 Remove `<NavBar />` and `<Footer />` from the global `App.jsx` wrapper (they will be owned by each layout shell)

## 2. Landing Layout & Page

- [x] 2.1 Create `src/components/layout/LandingLayout.jsx` — full-screen layout shell with no NavBar/Footer, renders `<Outlet />`
- [x] 2.2 Create `src/pages/LandingPage.jsx` — hero section with headline, sub-headline, "Login" and "Get Started" CTAs
- [x] 2.3 Add feature highlights section to `LandingPage` — three feature cards: Discover, RSVP, Navigate
- [x] 2.4 Add stats/social-proof section to `LandingPage` (faculties count, clubs count, RSVPs etc.)
- [x] 2.5 Style `LandingPage` as full-screen immersive: rich gradient or dark background, large typography, smooth framer-motion entrance animations
- [x] 2.6 Wire CTA buttons: "Login" → `/login`, "Get Started" → `/signup`

## 3. Auth Flow (Login & Signup)

- [x] 3.1 Redesign `src/pages/Login.jsx` as full-screen immersive — remove from old `PageShell`, use full-viewport layout with gradient background, centered card, framer-motion animations
- [x] 3.2 Add Student / Admin role toggle to login page
- [x] 3.3 Hide "Sign Up" link when Admin role is selected; show it only for Student role
- [x] 3.4 Update login redirect logic: student login → `/student`, admin login → `/admin`
- [x] 3.5 Create `src/pages/SignupPage.jsx` — full-screen immersive signup form with fields: Name, Email, Password, Student ID
- [x] 3.6 Add `signup` action to `RoleContext` — creates mock student account, stores to localStorage, sets `isLoggedIn = true` with role `student`
- [x] 3.7 Wire signup form submit: call `signup()` from `RoleContext`, redirect to `/student`
- [x] 3.8 Add "Already have an account? Login" link on signup page → `/login`

## 4. Student Layout Shell

- [x] 4.1 Create `src/components/layout/StudentLayout.jsx` — layout wrapper with student-specific top nav (logo + links: Dashboard, Events, Clubs, Navigate, Profile) and renders `<Outlet />`
- [x] 4.2 Style `StudentLayout` nav — warm, campus feel; highlight active route link
- [x] 4.3 Add logout button to `StudentLayout` nav that calls `logout()` from `RoleContext` and redirects to `/`
- [x] 4.4 Update all internal `navigate()` calls in student pages to use new `/student/*` paths

## 5. Student Dashboard

- [x] 5.1 Create `src/pages/student/StudentDashboard.jsx`
- [x] 5.2 Add personalized welcome panel — reads user name from `RoleContext`, displays greeting and current date
- [x] 5.3 Add Upcoming RSVPs section — reads user's RSVP'd event IDs from `RsvpContext`, maps to event data, renders event cards; shows empty state if none
- [x] 5.4 Add Recommended Events section — reads all events from `RsvpContext`, filters out already-RSVP'd events, displays top 3–4 as clickable event cards linking to `/student/events/:id`
- [x] 5.5 Style `StudentDashboard` — responsive grid layout, card-based sections, subtle animations

## 6. Admin Layout Shell

- [x] 6.1 Create `src/components/layout/AdminLayout.jsx` — sidebar layout wrapper with admin-specific nav (Dashboard, Events, Venues, Roster, Venue Upload) and renders `<Outlet />`
- [x] 6.2 Style `AdminLayout` sidebar — dark/neutral professional theme, visually distinct from student shell
- [x] 6.3 Add logout button to `AdminLayout` sidebar that calls `logout()` from `RoleContext` and redirects to `/`
- [x] 6.4 Update all internal `navigate()` calls in admin pages to use `/admin/*` paths (verify they already match)

## 7. Cleanup & Verification

- [x] 7.1 Remove or repurpose old `src/pages/Home.jsx` (replaced by `LandingPage.jsx`)
- [x] 7.2 Verify all student routes accessible at new `/student/*` paths in the browser
- [x] 7.3 Verify all admin routes accessible at `/admin/*` paths in the browser
- [x] 7.4 Verify landing page, login, and signup render with no app NavBar or Footer
- [x] 7.5 Verify student login flow end-to-end: landing → login → student dashboard
- [x] 7.6 Verify admin login flow end-to-end: landing → login (admin tab) → admin dashboard
- [x] 7.7 Verify student signup flow end-to-end: landing → signup → student dashboard
- [x] 7.8 Verify admin tab on login page shows no signup link
