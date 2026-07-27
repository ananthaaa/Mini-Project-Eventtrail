## Why

The CampusPulse UI currently lacks the full set of screens to demonstrate the end-to-end user flow. Adding these new pages will complete the visual reference build, allowing stakeholders to experience the student discovery, RSVP, and navigation flows, as well as the club admin experience for event and venue management, all using the established high-contrast dark mode design language.

## What Changes

- Create the Club Directory and Student Profile/Login pages.
- Create the Event Detail page with a schedule timeline and seat meter, along with the RSVP checkout flow.
- Create the Admin New Event form and the Admin Venue Setup page (with a waypoint editor).
- Create the Indoor Navigation phase (SVG floor-plan view) to simulate the handoff from outdoor routing.
- All new pages will adhere to the existing design tokens (dark theme, orange accent, large display type) and use Framer Motion for transitions.

## Capabilities

### New Capabilities
- `clubs`: Club directory listing and individual club profiles.
- `student-profile`: Student login form and logged-in profile view with RSVP history and role toggle.
- `event-discovery-detail`: Detailed event view, schedule timeline, seat meter, and RSVP checkout flow.
- `admin-venue-setup`: Admin interface for uploading venue floor plans and editing waypoints.
- `indoor-navigation`: Indoor routing phase utilizing SVG floor plans and step-by-step waypoint tracking.

### Modified Capabilities
- 

## Impact

- Expands the `src/pages` directory significantly.
- Introduces new local mock data structures for clubs, detailed event schedules, and indoor waypoints in `src/data`.
- Adds new UI components in `src/components/ui` to support the new layouts (e.g., login forms, step trackers, image upload zones).
