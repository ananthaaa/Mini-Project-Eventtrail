## Context

The CampusPulse app is intended to be a robust UI reference build. However, the current UI skips over several user journeys (like explicit login and detailed admin management) by using simple toggles and incomplete views. This design outlines how we will expand the mock UI to represent these missing user journeys without introducing an actual backend.

## Goals / Non-Goals

**Goals:**
- Provide a realistic UI flow for User Registration and Login.
- Expand the Admin Dashboard to include RSVP/Waitlist roster management, event deletion, and venue management.
- Simulate system notifications (e.g., from AWS SNS) using an in-app toast system.

**Non-Goals:**
- Connecting to any real backend or database.
- Modifying the visual design system or CSS variables. We will reuse existing UI primitives (cards, pills, badges) to build these new screens.

## Decisions

- **Mock State Location**: We will expand `RoleContext.jsx` to handle the simulated login state (e.g., `isLoggedIn`, `mockUser`). We will expand `RsvpContext.jsx` and `data/mockVenues.json` handling to support deletion and editing in the mock state.
- **Notification Simulation**: A new global `NotificationContext` will be created to fire Framer Motion-animated "toast" notifications that look like SMS/Email alerts when critical actions (RSVP, Geofence trigger) occur.
- **Admin Routing**: Add `/admin/event/:id/roster` for managing specific event attendees, and `/admin/venues` for the venue list.

## Risks / Trade-offs

- **[Risk] State Complexity** → As we add more CRUD operations to our local Context, the `RsvpContext` might get bloated. Mitigation: keep the mock reducers simple since they don't need to persist on page refresh.
