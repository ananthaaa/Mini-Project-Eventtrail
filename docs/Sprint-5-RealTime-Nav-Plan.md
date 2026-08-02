# Sprint 5: Real-Time Navigation & Indoor Guidance Upgrade

## Overview
This document outlines the detailed plan for upgrading the existing Mapbox and OpenStreetMap-based navigation module to support **Real-Time GPS Tracking**. This upgrade will fulfill the requirements of Sprint 5, allowing students to navigate the campus using live geolocation data rather than the current mock coordinate simulation.

## Goals
1. **Live GPS Integration:** Hook into the browser/device `navigator.geolocation` API to stream real-time latitude and longitude data.
2. **Dynamic Distance Calculation:** Continuously compute the Haversine distance between the user's physical location and the event venue's entrance coordinates.
3. **Automated Geofence Handoff:** Automatically trigger the transition from the outdoor Mapbox view to the indoor SVG floor plan when the user crosses a 30-meter geofence radius around the venue.
4. **Testing & Simulation Mode:** Retain a manual "Simulate" fallback to allow developers and administrators to test the end-to-end routing flow without needing to physically walk to the campus coordinates.

## Scope of Work

### 1. Hooking into the Geolocation API
- **File to Modify:** `src/pages/Navigate.jsx`
- Replace the existing `setInterval` logic (which linearly interpolates coordinates) with `navigator.geolocation.watchPosition()`.
- Ensure proper error handling if the user denies location permissions or if the device lacks GPS hardware.

### 2. State Management & Map Re-centering
- Bind the Mapbox `<Marker>` representing the user to the live GPS coordinates.
- Implement a map-follow mode (optional) to keep the user's marker centered on the screen as they walk.

### 3. Geofence Logic
- Evaluate the `distanceRemaining` variable on every GPS update.
- If `distanceRemaining <= 30` (meters):
  - Dispatch a success notification ("Geofence Boundary Reached").
  - Trigger the `simulateArrival()` equivalent to seamlessly transition the UI to the `indoor` phase, revealing the indoor step-by-step waypoints.

### 4. Admin Map Verification (Already Completed)
- The backend infrastructure required for this is already built. Admins can continue dropping physical map pins in `AdminEventForm.jsx` and `AdminVenueUpload.jsx` to accurately define the geofence targets.

## Implementation Steps (When Ready)
1. Add a toggle in the UI to switch between "Live GPS Mode" and "Simulation Mode".
2. Implement the `watchPosition` callback to update React state with high accuracy (`enableHighAccuracy: true`).
3. Add permission request banners for users who haven't granted location access.
4. Test the flow physically (if possible) or using browser developer tools (Sensors tab) to mock real-world movement.

---
*Note: As requested, this document serves as the architectural blueprint. Code implementation is currently paused until authorized.*
