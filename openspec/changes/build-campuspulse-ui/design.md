## Context

We are building a frontend-only reference implementation of CampusPulse UI to test and demonstrate the user journey (Event Discovery, RSVP, Navigation, and Admin CRUD) within the neobrutalist design aesthetic of Domenico Griffo's Didasko Framer template. All database calls, authentication, geofencing, and APIs are mocked locally.

## Goals / Non-Goals

**Goals:**
- Implement a cohesive neobrutalist styling system using Tailwind CSS custom tokens (warm off-white background, solid black borders, hard offset shadows, Epilogue/Inter fonts, dotted grid patterns).
- Build reusable UI primitives matching the Didasko neobrutalist anatomy (e.g., `Button` with solid black shadow, `Card` with thick black borders, `Marquee` ticker, and `Badge` tags).
- Model the complete multi-page flow using React Router: Home, Discovery, Event Detail, RSVP Confirmation, Navigate, Club Directory/Profile, and Admin Dashboard/CRUD.
- Maintain global mock state in React Context to dynamically update RSVP/waitlist statuses, seat meters, and navigation steps.
- Implement UI-only role-switching between Student and Admin via the NavBar.

**Non-Goals:**
- Creating backend endpoints (AWS serverless layers are out of scope).
- Persisting state beyond page refreshes (everything remains in memory).
- Real GPS tracking or Google Maps API integration (replaced by simulated map paths).
- Implementing authentication services (Cognito).

## Decisions

### Decision 1: Tailwind CSS Neobrutalist Design Token Integration
We will configure neobrutalist design tokens in `tailwind.config.js`:
- Colors:
  - `bg-neobrutalist`: `#F9F5F6` (page background)
  - `accent-yellow`: `#FFDB58` (accent)
  - `pastel-mint`: `#DAF5F0`
  - `pastel-peach`: `#F8D6B3`
  - `pastel-yellow`: `#FDFD96`
  - `border-black`: `#000000`
- Font Family:
  - `font-display`: `"Epilogue"`, `"Epilogue Placeholder"`, sans-serif
  - `font-body`: `"Inter"`, sans-serif
- Borders: `border-3` (3px border width).
- Shadows: Custom neobrutalist shadows: `shadow-neobrutalist-sm` (`2px 2px 0px 0px #000`), `shadow-neobrutalist` (`4px 4px 0px 0px #000`), and `shadow-neobrutalist-lg` (`6px 6px 0px 0px #000`).

### Decision 2: Framer Motion for Neobrutalist micro-interactions
To capture the feel of the Didasko Framer site, we will utilize Framer Motion to animate:
- Spring animations for button presses (translating down/right on click and shadow shrinking).
- Slide-in card entrance reveals and marquee tickers.

### Decision 3: Simulation State in React Context
- `RsvpContext`: Stores event records (initially populated from `mockEvents.json`) and handles RSVP submissions (capacity changes, status tracking).
- `NavModeContext`: Stores navigation details (current step, active navigation phase: outdoor/indoor).
- `RoleContext`: Controls whether the navbar renders the Student flow or the Admin flow.

### Decision 4: Simulated Indoor Navigation using Inline SVG
Instead of importing a complex map library, indoor mapping will use a clean, inline SVG layout depicting a campus building floor plan. Map coordinates and steps will update dynamically in response to step button clicks and a simulated arrival button.

### Decision 5: Dot-Matrix / Dotted Grid Background Pattern
Add a global CSS background pattern in `src/index.css` using SVG background grid/dots matching Didasko's web pattern overlay.

## Risks / Trade-offs

- **[Risk] State resets on refresh** -> **[Mitigation]** The reference app has a role switch toggle. To keep state persistent for short-term testing, we can optionally save Context state to `localStorage`, though a full reset is considered acceptable.
- **[Risk] No backend validation** -> **[Mitigation]** Since this is a reference build, the forms in the Admin panel will push directly into local state, showing the updated list immediately on redirect.
