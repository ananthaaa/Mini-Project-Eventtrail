# Sprint 5: Leaflet Map & Navigation Module 

## Overview
This document outlines the architectural plan to rebuild the **Sprint 5: Navigation and Indoor Guidance** module to perfectly match the project specifications outlined in `CampusPulse_Map_Feature (1).md`. 

The current Mapbox (`react-map-gl`) implementation will be deprecated and replaced entirely with an open-source, cost-free stack centered around **Leaflet.js**, **OpenStreetMap**, and **OpenRouteService**.

## 1. Core Technologies
- **Leaflet.js & React-Leaflet:** To render the interactive map, markers, popups, and indoor floor plan SVG/Image overlays.
- **OpenStreetMap (OSM):** To serve the base map tiles, providing accurate building footprints for the ASIET campus without needing custom imagery.
- **OpenRouteService (ORS):** To replace the custom DynamoDB A* graph algorithm. ORS will calculate the shortest walking path along real campus footpaths.
- **Leaflet Routing Machine (LRM):** To visually draw the ORS route as a highlighted line on the map and display turn-by-turn text instructions.

## 2. Execution Plan (Frontend)

### Phase 1: Dependency Overhaul
- Uninstall `react-map-gl` and `mapbox-gl`.
- Install `leaflet`, `react-leaflet`, `leaflet-routing-machine`, and their associated types.

### Phase 2: Refactoring `CampusMap.jsx`
- Replace the Mapbox wrapper with `MapContainer` and `TileLayer` from `react-leaflet`.
- Configure the map tiles to target OpenStreetMap: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`.

### Phase 3: Admin Location Editor
- Update `AdminEventForm.jsx` and `AdminVenueUpload.jsx`.
- Implement a Leaflet map where admins can click to drop a marker.
- Use Leaflet events to capture the Lat/Lng of the click and save it directly to the DynamoDB `Locations`/`Venues` table.

### Phase 4: Student Navigation (`Navigate.jsx`)
- **Initialization:** Read the venue's destination coordinates from DynamoDB.
- **Real-Time Tracking:** Use `navigator.geolocation.watchPosition()` to stream the student's live GPS coordinates.
- **Outdoor Routing:** Feed the live GPS start point and the building destination point into OpenRouteService. Render the returned path using Leaflet Routing Machine.
- **Geofence Handoff:** Continuously monitor the distance to the destination. When the GPS registers a distance of **< 20 meters**, automatically transition the UI to indoor mode.
- **Indoor Mode:** Clear the OSM tiles and outdoor route. Overlay the admin-uploaded floor plan image onto the Leaflet map bounds and display the specific room-level indoor text directions.

## 3. Execution Plan (Backend)
- The existing AWS Lambda and API Gateway endpoints (`GET /venues`, `POST /venues`) will remain largely the same, serving the dynamic location markers to the frontend.
- **Live Seat Availability:** Ensure the frontend polls the backend (e.g., every 10 seconds) to fetch live RSVP counts and update the Leaflet popups dynamically.

---
*Note: This document serves as the implementation blueprint. Code execution for this rewrite is paused until authorized.*
