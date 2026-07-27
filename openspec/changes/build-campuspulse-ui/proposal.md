## Why

Build a visual-only, non-functional-backend reference app for CampusPulse. The goal is to reproduce the screen flow (event discovery → RSVP → navigation → admin) using the vibrant, high-contrast neobrutalist design language of Didasko (high-contrast, thick solid borders, hard offset shadows, vibrant/pastel color blocks, bold typography) to study and rehearse the layout, typography, components, and interactions before implementing the real serverless backend.

## What Changes

- Create a fresh React + Vite project in the `ui` directory (if not already initialized) and configure Tailwind CSS and Framer Motion.
- Establish the neobrutalist theme: high-contrast layout, warm off-white background (`#F9F5F6`), thick solid black borders (3px), hard offset box shadows (6px 6px), geometric sans-serif heading typography (Epilogue), and a vibrant mustard yellow accent (`#FFDB58`).
- Build core Didasko-style neobrutalist UI primitives: `Button` (rectangular, black borders, solid offset shadow), `Badge` (pastel colored tag labels), `Card` (bordered, offset shadow, shifts on hover), and `Marquee` (horizontal text ticker).
- Implement standard Layout components: `NavBar` with a role switcher (Student / Admin), `Footer`, and `PageShell`.
- Implement pages:
  - **Home**: Neobrutalist hero section (giant bold Epilogue H1, mustard yellow CTA with offset shadow, dot-matrix background, feature cards), trust badges, and feature trio section.
  - **Event Discovery**: Filter bar, square bordered date-tabs, and event cards.
  - **Event Detail**: Visual details, schedules, organizer cards, animated seat meter, and RSVP button.
  - **RSVP Confirmation**: Ticket-card visualization with neobrutalist ticket styling (dashed borders, solid shadows) and simulated waitlist banner.
  - **Navigate (Outdoor/Indoor)**: Simulated Map with route, simulated geofence trigger button, and indoor SVG step tracker.
  - **Club Directory / Profile**: Grid of clubs, club about page, member grid, and club events.
  - **Admin Dashboard / Forms**: Admin interface for viewing RSVP stats, creating events, and configuring venue waypoints.
- Create local mock JSON datasets for all events, clubs, speakers, and venue maps.
- Set up React Context (`RsvpContext`, `NavModeContext`) to manage global simulated states.

## Capabilities

### New Capabilities
- `event-discovery`: Browsing, searching, and filtering campus events by date/faculty, including schedule timelines and detailed organizer card sections.
- `rsvp-management`: RSVP flow with ticket visualization, animated seat meter, and state transition to waitlist.
- `venue-navigation`: Dual-phase navigation with simulated outdoor routing and indoor SVG waypoint step-by-step guidance.
- `club-directory`: Catalog of student organizations, including club profile details, member directories, and club-specific event lists.
- `admin-management`: Admin dashboard containing flat-style CRUD forms for events and venue waypoint floor plan configurations.

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->

## Impact

- **New Frontend Stack**: React, React Router, Tailwind CSS, Framer Motion.
- **Local Data Mocking**: Local JSON files (no external APIs/databases).
- **Design Tokens**: Standardized CSS root variables and Tailwind configuration overrides.
