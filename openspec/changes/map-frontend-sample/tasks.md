## 1. Map Package Installation

- [x] 1.1 Install `react-leaflet`, `leaflet`, and `leaflet/dist/leaflet.css` in the project.

## 2. Admin Map UI

- [x] 2.1 Update `AdminVenueUpload.jsx` and `AdminEventForm.jsx` to include an interactive Leaflet map for placing the building entrance pin.
- [x] 2.2 Add state variables to store the selected latitude and longitude coordinates.
- [x] 2.3 Implement the Indoor Steps Editor with "Add Step" and "Remove Step" functionality.

## 3. Student Outdoor Nav Phase

- [x] 3.1 Update `Navigate.jsx` to load a Leaflet map upon taking the "Take Me There" action.
- [x] 3.2 Display a mock path polyline from a dummy GPS coordinate to the building entrance.
- [x] 3.3 Implement `setInterval` to advance the student's blue dot along the path.
- [x] 3.4 Implement a Haversine distance calculator to update distance dynamically.

## 4. Student Indoor Nav Phase

- [x] 4.1 Update `NavModeContext` and `Navigate.jsx` to detect when Haversine distance is <= 30m.
- [x] 4.2 Switch the view from the map to the interactive Indoor Steps Panel automatically.
- [x] 4.3 Allow students to tap "Done" on each step to progress sequentially.
- [x] 4.4 Render the Arrival Celebration UI and update the destination pin to green upon completion.
