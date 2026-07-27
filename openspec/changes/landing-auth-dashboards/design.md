## Context

CampusPulse is a React + Vite SPA using `react-router-dom` v6 with a `HashRouter`. Auth is mock/localStorage-based via `RoleContext`. The app currently has a single `App.jsx` that mounts one `<NavBar>` and `<Footer>` for every route — student and admin pages share the same chrome. `Home.jsx` acts as a partial landing page but is embedded in the app shell and pulls live RSVP mock data.

The goal is to introduce three clearly separated layout contexts: Public (landing + auth), Student, and Admin — each with its own visual identity and navigation structure.

## Goals / Non-Goals

**Goals:**
- Introduce a standalone `LandingLayout` with no app NavBar/Footer — full-screen immersive pages
- Introduce a `StudentLayout` with its own nav wrapping `/student/*` routes
- Introduce an `AdminLayout` with its own sidebar nav wrapping `/admin/*` routes
- Build a full-screen `LandingPage` with hero, feature highlights, and CTA buttons
- Build a full-screen `LoginPage` (student + admin toggle) styled consistently with the landing page
- Build a full-screen `SignupPage` for students (Name, Email, Password, Student ID)
- Build a `StudentDashboard` home with personalized welcome, upcoming RSVPs, recommended events
- Migrate existing student routes from `/` root to `/student/*`
- Hide admin signup — admin accounts login-only

**Non-Goals:**
- Real backend authentication (stays mock + localStorage)
- Admin self-registration flow
- Route-level auth guards / protected route components (out of scope for this change)
- Mobile native app changes

## Decisions

### 1. Three layout shells via nested `<Route>` with `<Outlet>`

**Decision:** Use React Router v6 layout routes — each shell is a wrapper component that renders `<Outlet />` for its children.

```
<Routes>
  <Route element={<LandingLayout />}>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
  </Route>

  <Route path="/student" element={<StudentLayout />}>
    <Route index element={<StudentDashboard />} />
    <Route path="events" element={<EventDiscovery />} />
    <Route path="events/:id" element={<EventDetail />} />
    <Route path="clubs" element={<ClubDirectory />} />
    <Route path="clubs/:id" element={<ClubProfile />} />
    <Route path="navigate" element={<Navigate />} />
    <Route path="profile" element={<StudentProfile />} />
    <Route path="rsvp-confirmation/:id" element={<RsvpConfirmation />} />
  </Route>

  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} />
    <Route path="event-form" element={<AdminEventForm />} />
    <Route path="event/:id/roster" element={<AdminRoster />} />
    <Route path="venues" element={<AdminVenueList />} />
    <Route path="venue-upload" element={<AdminVenueUpload />} />
  </Route>
</Routes>
```

**Why:** Clean separation, no shared chrome leaking, easy to extend per zone. v6 nested routes make layout composition natural.

**Alternative considered:** Rendering NavBar conditionally by route — rejected because it's brittle and creates shared state coupling.

### 2. Landing page is purely static (no live data)

**Decision:** `LandingPage` does not consume `RsvpContext` or any live mock data. It uses static feature copy and illustration — pure marketing content.

**Why:** Landing page should load fast and be independent of app data layer. It's a public entry point, not an app feature.

### 3. Login/Signup styled as full-screen immersive pages

**Decision:** Both pages use `min-h-screen` full-viewport layout with a rich gradient or dark background, centered card, smooth framer-motion transitions. They are inside `LandingLayout` (not `StudentLayout`/`AdminLayout`), so they get no app NavBar.

**Why:** Cohesive public-zone experience. Immersive auth forms feel premium and distinct from the in-app experience.

### 4. Admin signup removed, student signup added

**Decision:** The login page role toggle shows Student / Admin. When Admin is selected, a "Sign Up" link/tab is hidden. Student signup is a separate route `/signup` with fields: Name, Email, Password, Student ID.

**Why:** Admin accounts are pre-created — self-service registration would be a security risk. Student registration is self-serve.

### 5. StudentDashboard as personalized home (mock data)

**Decision:** `StudentDashboard` reads from `RsvpContext` (user's RSVPs) and `events` data to build:
- Welcome panel with user name from `RoleContext`
- Upcoming RSVPs: filtered events where user has RSVP'd
- Recommended events: top events not yet RSVP'd

**Why:** Gives the student a personalized home immediately after login — much better UX than redirecting to a generic event list.

### 6. Route migration — old paths preserved as redirects

**Decision:** Old paths (`/discover`, `/clubs`, etc.) are kept as `<Route>` entries with `<Navigate replace to="/student/..." />` redirects so any bookmarked URLs don't break.

**Why:** Graceful migration — internal links in existing code can be updated incrementally.

## Risks / Trade-offs

- **Route migration breaks existing internal `useNavigate` calls** → Mitigation: Update all `navigate('/discover')` calls to `navigate('/student/events')` in the same PR
- **LandingLayout has no NavBar** — if user manually types `/student/events` without logging in, they get the student shell with no guard → Mitigation: Out of scope for this change; auth guards are a follow-up
- **Mock auth is trivially bypassable** — anyone can set localStorage values → Acceptable for a demo/mock app; real guards to come with `integrate-aws-backend` change
