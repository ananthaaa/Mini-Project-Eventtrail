## Context

The CampusPulse UI project is a reference build designed to validate the integration of the Eventin design system into the CampusPulse product flows. Currently, the UI is incomplete. We need to implement the remaining screens (Clubs, Profiles, detailed Event view, Admin surfaces, and Navigation handoff) to create a fully clickable prototype before any backend integration begins.

## Goals / Non-Goals

**Goals:**
- Implement visually accurate representations of the remaining CampusPulse features using the defined design tokens.
- Wire up local state to make the prototype clickable (e.g., toggling the "View as Admin" mode, tapping RSVP and seeing confirmation).

**Non-Goals:**
- Backend integration (no AWS, database, or API calls).
- True geolocation or GPS routing for navigation.
- Persistent state across browser refreshes.

## Decisions

- **Local State Management**: We will use React Context (`AppStateContext`) to hold temporary session state like the current active role (Student vs Admin), RSVP status for specific events, and the current active navigation phase. Rationale: It avoids prop drilling and simulates a real app feel without the complexity of a real backend.
- **Mock Data Layer**: All club, event, and venue data will be stored as static JSON arrays in a `src/data/` folder and imported directly into components.
- **Navigation Handoff Simulation**: The handoff from Outdoor to Indoor navigation will be triggered manually by a "Simulate Arrival" button to demonstrate the UI transition without needing real geofencing logic.

## Risks / Trade-offs

- [Risk] Components might become too tightly coupled to the mock data structure. → Mitigation: Define clear interfaces/PropTypes for the components so they can easily accept real data shapes later.
- [Risk] State management in Context might get messy if the mock logic grows too complex. → Mitigation: Keep the mock logic intentionally simple (e.g., just storing boolean RSVP flags instead of full transaction records).
