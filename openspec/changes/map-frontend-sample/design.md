## Context

The EventTrail application is currently a frontend reference build. We are introducing the interactive navigation simulation so stakeholders can test the dual-phase navigation flow without an actual backend. The simulation requires handling interactive maps, calculating outdoor paths, measuring distance, and transitioning seamlessly to an indoor step-by-step panel.

## Goals / Non-Goals

**Goals:**
- Provide a full frontend-only simulation of the outdoor and indoor navigation phases.
- Allow admins to pick coordinates on a map and specify indoor steps.
- Simulate the student walking path and geofence threshold transition (30 meters).
- Update the UI from static placeholders to dynamic Leaflet maps and interactive step trackers.

**Non-Goals:**
- Do not integrate actual AWS backend APIs.
- Do not make actual live GPS calls for the student (mock it).

## Decisions

- **Map Library**: We will use `react-leaflet` to render interactive maps for both Admin and Student views. It provides an easy integration with OSM base layers and handles markers and polylines perfectly for our mock routing.
- **Route Calculation**: We will mock OpenRouteService on the frontend by manually feeding an array of coordinates, or by implementing a small helper function that generates a straight-line interpolating path from a dummy starting point to the destination entrance.
- **Distance Calculation**: We will implement a Haversine formula utility on the frontend. The system will use `setInterval` to simulate movement and calculate the Haversine distance on each tick to trigger the geofence handoff.
- **State Management**: We will update the existing `NavModeContext` to include state for map layers, distance remaining, and the active map view.

## Risks / Trade-offs

- **Risk**: Mocking a walking route without an actual routing API could result in unrealistic paths traversing buildings.
  - **Mitigation**: This is a known trade-off since it's a frontend mock. We will use a pre-calculated realistic path coordinate array for the primary demo event, or accept straight lines for newly created events.
