## Why

The EventTrail application is a frontend UI reference build. To properly demonstrate the unique value proposition of the app—the dual-phase navigation system—we need a highly interactive mock map experience. Currently, navigation is abstracted. We need to build a comprehensive frontend simulation of the map experience for both Admins (setting up venues with pins and steps) and Students (navigating outdoor and indoor routes) to validate the design flow before real backend integration.

## What Changes

- Add a map pin picker and indoor steps editor to the Admin "Create Event" / "Venue Upload" form.
- Integrate Leaflet maps in the student flow for the outdoor navigation phase.
- Simulate OpenRouteService route calculation to draw a path from a mocked student GPS location to the building entrance.
- Track distance via Haversine formula and simulate a Geofence trigger at 30 meters.
- Add an interactive Indoor Navigation Panel where students step through text directions upon geofence arrival.

## Capabilities

### New Capabilities
- `admin-map-setup`: Admin interface for selecting a building entrance coordinate and inputting step-by-step indoor directions.
- `student-outdoor-nav`: Outdoor GPS simulation, route drawing via Leaflet, and dynamic distance calculations.
- `student-indoor-nav`: Interactive indoor step-tracking interface triggered by a geofence handoff.

### Modified Capabilities
- 

## Impact

- `AdminVenueUpload.jsx` and `AdminEventForm.jsx` will be updated to include map picking UI.
- `Navigate.jsx` will be overhauled to show an actual interactive Leaflet map instead of a static simulation screen.
- Addition of Leaflet and potential routing library dependencies to the frontend package.
