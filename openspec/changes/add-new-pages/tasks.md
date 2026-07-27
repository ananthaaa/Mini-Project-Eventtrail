## 1. Setup & Mock Data

- [x] 1.1 Create mock JSON data for clubs, student RSVP history, and indoor waypoints in `src/data/`
- [x] 1.2 Extend React Context to support role toggling, RSVP flags, and indoor/outdoor phase state

## 2. Component Primitives

- [x] 2.1 Build `SeatMeter` and `RSVPTicket` components for the checkout flow
- [x] 2.2 Build `StepTracker` for navigation waypoints
- [x] 2.3 Build `ImageUploadZone` for the admin venue setup

## 3. Page Implementation: Clubs & Profile

- [x] 3.1 Implement `ClubDirectory.jsx` with a responsive grid layout
- [x] 3.2 Implement `ClubProfile.jsx` showing details and upcoming events
- [x] 3.3 Implement `StudentProfile.jsx` with the split login form and logged-in dashboard view

## 4. Page Implementation: Event Detail & RSVP

- [x] 4.1 Implement `EventDetail.jsx` featuring the hero image, timeline, and seat meter
- [x] 4.2 Wire the RSVP button to trigger the ticket confirmation view and update local context

## 5. Page Implementation: Admin Surfaces

- [x] 5.1 Implement `AdminEventForm.jsx` for creating new events
- [x] 5.2 Implement `AdminVenueSetup.jsx` featuring the SVG upload zone and draggable waypoint list

## 6. Page Implementation: Navigation Surfaces

- [x] 6.1 Implement `Navigate.jsx` integrating `StepTracker` for indoor phases
- [x] 6.2 Wire `NavModeContext` to simulate arriving at the venue and transitioning to the indoor waypoints

## 7. Final Integration

- [x] 7.1 Register all new routes in `App.jsx`
- [x] 7.2 Ensure consistent dark-mode styling and apply Framer Motion page transitions
