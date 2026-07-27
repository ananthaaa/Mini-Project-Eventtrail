# CampusPulse — UI Reference Build

**Purpose of this build:** a visual-only, non-functional-backend reference app. The goal is to reproduce the CampusPulse screen flow (event discovery → RSVP → navigation → admin) using the **design language of [Eventin](https://eventin.framer.website/#pricing)** almost exactly — same layout rhythm, component shapes, typography scale, motion, and section patterns — just re-skinned with CampusPulse content. No AWS, no real backend, no auth logic. Everything is mock JSON + local component state, wired together so it *feels* like a real product when you click through it.

> Note on the design tokens below: Framer sites ship compiled/hashed CSS, so exact hex values and font files can't be scraped directly from the page. What's captured here is the **structural design system** — layout patterns, type scale, component anatomy, spacing rhythm, and interaction style — read directly off the live site's markup and content order. Treat the color values as a faithful, adjustable starting palette (dark, high-contrast, single accent), and swap in exact hex/fonts by inspecting the live site in your browser's DevTools if you want pixel-perfect matching.

---

## 1. Design System Extracted from Eventin

### 1.1 Visual Personality
Dark, high-contrast, editorial-bold event landing page. Big display type, lots of negative space, one saturated accent color used sparingly (buttons, icons, small tags), everything else in near-black / off-white / grey. Rounded-pill buttons with a leading or trailing icon. Small "eyebrow" tags (icon + label) above every section heading. Numbered sections (01 / 02 / 03) for story-style content. Card-based grids for pricing, speakers, and schedules. Marquee/ticker text in the footer.

### 1.2 Color Tokens
```css
:root {
  /* Base */
  --bg-primary: #0B0B0C;      /* near-black page background */
  --bg-surface: #151517;      /* card / panel background */
  --bg-surface-alt: #1D1D20;  /* hover / alt panel */
  --border-subtle: #2A2A2E;

  /* Text */
  --text-primary: #F5F5F2;    /* off-white headings */
  --text-secondary: #A8A8AC;  /* body / muted */
  --text-tertiary: #6E6E73;

  /* Accent — swap for exact brand hue after DevTools inspection */
  --accent: #FF5A1F;          /* warm orange, used on Eventin's CTAs/badges */
  --accent-hover: #FF7A45;
  --accent-contrast: #0B0B0C;

  /* Utility */
  --success: #3DD68C;
  --overlay: rgba(0,0,0,0.55);
}
```

### 1.3 Typography
```css
--font-display: "Neue Montreal", "General Sans", "Inter", sans-serif; /* big bold headlines */
--font-body: "Inter", "Helvetica Neue", sans-serif;

--text-hero:      clamp(2.5rem, 6vw, 4.5rem);   /* section H1, e.g. "Innovators Connect Event Live" */
--text-h2:        clamp(1.75rem, 3.5vw, 2.75rem); /* "AN Exciting and inspiring Event" style */
--text-h3:        1.25rem;                       /* card titles */
--text-eyebrow:   0.75rem;  /* uppercase, letter-spacing 0.12em — the small tag above headings */
--text-body:      1rem;
--text-small:     0.875rem;

/* Weight: display headings 600–700, body 400–500 */
/* Headline casing is inconsistent on purpose (e.g. "AN Exciting and inspiring") — keep normal case in the rebuild */
```

### 1.4 Spacing & Layout Rhythm
- Section vertical padding: `96–140px` desktop, `56–72px` mobile.
- Max content width: `1200px`, centered, `24px` side gutters on mobile.
- Grid gaps: `24px` (cards), `16px` (tight lists).
- Corner radius: `999px` for pills/buttons, `20–24px` for cards, `12px` for small tags/badges.

### 1.5 Core Components (as seen on the live site)
| Component | Anatomy | Where it's used |
|---|---|---|
| **Eyebrow tag** | small icon/logo mark + uppercase label, sits above every H2 | "About Event", "Our Events", "Pricing plans", "Our Speakers" |
| **Pill CTA button** | rounded-full, accent fill, icon on the right (arrow/chevron), scales/darkens on hover | "Book Your Seat", "Get a ticket", "Get Started Now" |
| **Rotating hero headline** | large serif/display line that cross-fades between taglines behind the main H1 | Hero section |
| **Badge circles** | two overlapping circular badges near hero copy (trust/credential marks) | Hero |
| **Feature trio** | icon + short title + one-line description, repeated in 3s, sometimes looping/marquee | "Expert Speakers / Innovative Ideas / Business Growth" |
| **Date-tab schedule** | horizontal date tabs (22 / 24 / 26 Jan) switch a vertical timeline of sessions with time, title, speaker photo | "Our Events" |
| **Sponsor logo strip** | two tiers (Platinum / Gold), grayscale logos in a responsive row | "Supported by Industry Leaders" |
| **Speaker card** | full-bleed portrait photo, name + role overlay at bottom | "Our Speakers" |
| **Masonry/scroll gallery** | uneven-height image columns, horizontal scroll or CSS columns | "Best Moments" gallery |
| **Pricing card (3-tier)** | plan name, big price + "/Ticket", checklist with icon bullets, pill CTA; middle tier visually emphasized | "Pricing plans" |
| **Numbered story block** | large "01/02/03", small title, image, one-line copy — alternating layout | "Why Choose Us" |
| **Map + contact card** | embedded map on one side, address/email/phone + "get direction" pill on the other | Location section |
| **Marquee strip** | looping horizontal ticker of tag words + small icons | above footer |
| **Footer** | newsletter input + subscribe pill, social icons, quick links column, giant background wordmark, copyright line | Footer |

### 1.6 Motion
- Cross-fade rotating hero text (~2.5s per line).
- Section reveal on scroll: fade + slight translate-Y (20–30px), staggered for grid children.
- Hover: buttons scale ~1.03 + accent brightens; cards lift with a soft shadow.
- Marquee: continuous linear-scroll ticker, pause on hover.

---

## 2. Tech Stack (this reference build only)

Purely front-end, static, no server calls:

- **React** (Vite) + **React Router** for screen-to-screen navigation
- **Tailwind CSS** for styling, with the tokens above added to `tailwind.config.js`
- **Framer Motion** for the reveal/hover/marquee animations (fits naturally given the source is a Framer site)
- **Local mock data** — plain JSON/TS files standing in for events, clubs, speakers/organizers, tickets, and floor-plan waypoints
- **React state / Context** for RSVP status, waitlist position, and navigation mode (outdoor/indoor) — all in-memory, nothing persisted
- No AWS, no auth, no database, no real GPS/routing calls — geolocation and map handoff are simulated with a toggle/mock coordinate

---

## 3. Folder Structure

```
campuspulse-ui/
├── src/
│   ├── assets/               # icons, illustration placeholders, floor-plan SVGs
│   ├── components/
│   │   ├── ui/                # Button, EyebrowTag, Badge, PillTab, Card, Marquee
│   │   ├── hero/               # RotatingHeadline, HeroBadges
│   │   ├── events/              # EventCard, DateTabs, ScheduleTimeline, EventFilterBar
│   │   ├── rsvp/                # RSVPButton, SeatMeter, WaitlistBanner
│   │   ├── navigation/           # OutdoorMap, IndoorMap, GeofenceHandoffToast, StepTracker
│   │   ├── clubs/                # ClubCard, ClubHeader, MemberList
│   │   ├── pricing/               # kept as "Perks/Passes" cards (repurposed pricing pattern)
│   │   └── layout/                # NavBar, Footer, PageShell
│   ├── data/                    # mockEvents.json, mockClubs.json, mockSpeakers.json, mockVenues.json
│   ├── context/                 # RsvpContext, NavModeContext
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── EventDiscovery.jsx
│   │   ├── EventDetail.jsx
│   │   ├── RsvpConfirmation.jsx
│   │   ├── Navigate.jsx
│   │   ├── ClubDirectory.jsx
│   │   ├── ClubProfile.jsx
│   │   └── admin/
│   │       ├── AdminDashboard.jsx
│   │       ├── AdminEventForm.jsx
│   │       └── AdminVenueUpload.jsx
│   ├── App.jsx
│   └── main.jsx
├── tailwind.config.js
└── project.md
```

---

## 4. Screen Flow (mapped 1:1 onto Eventin's section rhythm)

Each CampusPulse screen reuses an Eventin section pattern so the whole app reads as one continuous, consistent product rather than a patchwork.

```
[Home / Landing]
  Hero (rotating headline: campus event taglines) + pill CTA "Explore Events"
        │
        ▼
[About / Value strip]  →  "Feature trio" pattern: Discover · RSVP · Navigate
        │
        ▼
[Event Discovery]  →  "Our Events" date-tab pattern, but tabs = Today / This Week / By Faculty
   filter bar (category, date, faculty) styled as pill tabs
        │  tap an event card
        ▼
[Event Detail]  →  hero image + eyebrow tag ("Tech Fest 2026"), schedule timeline,
   organizer/club card (styled like "Speaker card"), seat meter, RSVP pill button
        │  tap RSVP
        ▼
[RSVP Confirmation]  →  confirmation card with ticket-style visual (reuses "Pricing card" anatomy:
   event name instead of plan name, seat # instead of price, checklist = "what's next")
   Seat full? → shows "Waitlist Banner" state instead of confirmation
        │  tap "Navigate to Venue"
        ▼
[Navigate — Outdoor Phase]  →  full-bleed map (Leaflet placeholder), route polyline (mocked),
   "you are walking" status pill, distance/time badge
        │  simulated geofence trigger (button: "Simulate Arrival")
        ▼
[Navigate — Indoor Phase]  →  SVG floor plan, numbered step tracker (reuses "01/02/03 story block"
   pattern from "Why Choose Us"), progress bar, arrival confirmation state
        │
        ▼
[Club Directory]  →  sponsor-strip-style grid of club logos, tap to open
        │
        ▼
[Club Profile]  →  club header + "About Event" pattern repurposed as "About Club",
   member grid using the Speaker card component, upcoming events list
```

Admin surface (separate nav, same visual system, simpler flat cards instead of dark hero sections):
```
[Admin Dashboard]  →  event list table + live RSVP/waitlist counts (card stat tiles)
        │
        ▼
[Admin: Create/Edit Event]  →  form styled with the same input/pill-button language
        │
        ▼
[Admin: Upload Venue & Floor Plan]  →  image upload zone + waypoint step editor (mocked, no storage)
```

---

## 5. User Flow (role-based, UI-only — no real auth, just a role switch toggle)

**Student**
1. Land on Home → scroll value props → tap "Explore Events"
2. Filter/browse Event Discovery → open an Event Detail
3. Tap RSVP → see Seat Meter animate → Confirmation (or Waitlist state)
4. Tap "Navigate" → Outdoor map screen → tap "Simulate Arrival" → Indoor step tracker → arrival confirmation
5. Browse Club Directory → open a Club Profile → see upcoming club events

**Club Admin** *(toggle "View as Admin" in the nav — purely a UI state switch)*
1. Land on Admin Dashboard → see event cards with live (mock) RSVP/waitlist counts
2. Tap "New Event" → fill the styled form → "Publish" just pushes into local mock state
3. Tap a venue → Upload Venue & Floor Plan screen → add mock waypoints/step text

---

## 6. Build Phases

1. **Design tokens & primitives** — set up Tailwind config with the color/type/spacing tokens above; build `Button`, `EyebrowTag`, `Card`, `PillTab`, `Marquee` primitives and verify they visually match Eventin's component anatomy.
2. **Layout shell** — NavBar (logo + pill nav links + role toggle), Footer (newsletter block + marquee + quick links), PageShell wrapper.
3. **Home** — rotating hero headline, badges, feature trio, CTA.
4. **Event Discovery + Event Detail** — date-tab pattern, filter bar, schedule timeline, seat meter.
5. **RSVP + Confirmation/Waitlist** — ticket-card pattern, state transitions on button tap.
6. **Navigate (Outdoor → Indoor)** — map placeholder, mocked polyline, geofence simulate button, step tracker with progress bar.
7. **Club Directory + Club Profile** — logo grid, club header, member grid.
8. **Admin Dashboard, Event Form, Venue Upload** — flatter card style, same tokens, mock CRUD against local state only.
9. **Polish pass** — scroll-reveal + hover motion with Framer Motion, responsive check at 375 / 768 / 1280px, dark-mode contrast audit.

---

## 7. Explicit Non-Goals

- No AWS Lambda / API Gateway / DynamoDB / Cognito / SNS — everything is local mock data and component state.
- No real authentication — role switching is a UI toggle only.
- No real GPS/geofencing/routing — outdoor/indoor handoff is manually triggered for demo purposes.
- No persistence — refreshing the page resets all mock state.

This build exists purely to study and rehearse the Eventin design system and validate that CampusPulse's real feature set (event discovery, RSVP + waitlist, dual-phase navigation, club pages, admin dashboard) can be skinned into that visual language coherently, before any of it touches the real serverless backend.
