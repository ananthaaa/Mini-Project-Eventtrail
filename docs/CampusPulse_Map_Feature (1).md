# CampusPulse — Interactive Campus Event Navigator
## Complete Map Feature Documentation

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [Technologies Used](#2-technologies-used)
3. [System Architecture](#3-system-architecture)
4. [Database Design](#4-database-design)
5. [Map Setup — Step by Step](#5-map-setup--step-by-step)
6. [Marker System](#6-marker-system)
7. [Popup with Event Details](#7-popup-with-event-details)
8. [Live Seat Availability](#8-live-seat-availability)
9. [Outdoor Navigation](#9-outdoor-navigation)
10. [Indoor Floor Plan Navigation](#10-indoor-floor-plan-navigation)
11. [Admin Map Editor](#11-admin-map-editor)
12. [List View and Map View Toggle](#12-list-view-and-map-view-toggle)
13. [Multi-Floor Handling](#13-multi-floor-handling)
14. [ASIET Campus Specific Setup](#14-asiet-campus-specific-setup)
15. [Complete Navigation Flow](#15-complete-navigation-flow)
16. [Viva Questions and Answers](#16-viva-questions-and-answers)

---

## 1. Feature Overview

The Interactive Campus Event Navigator is a core feature of CampusPulse that solves a real student problem — not knowing where events are happening or how to get there.

### Problem it Solves

Without this feature, an event shows only a text venue like "Workshop Hall, Block B, Floor 2, Room 204". A new student has no idea where that is. They wander around, arrive late or not at all, and miss the event entirely.

### What the Feature Does

```
Student opens CampusPulse
         ↓
Sees campus map with coloured markers on buildings
         ↓
Clicks a marker on Block B
         ↓
Popup shows:
  - Building name and location
  - Floor and room number
  - Event name and time
  - Live seat availability
  - Navigate button
         ↓
Taps Navigate
         ↓
Outdoor route drawn from student's
current GPS location to Block B entrance
         ↓
Student walks following the route line
         ↓
Reaches Block B entrance
         ↓
App switches to floor plan view
         ↓
Floor 2 plan shown with Room 204 highlighted
Text directions guide student to the exact room
```

### Key Capabilities

- View all event locations on an interactive campus map
- Switch between List View and Map View of events
- Click markers to see event details and live seat counts
- Get outdoor walking directions from current location to building entrance
- View floor plan with indoor text directions for multi-floor buildings
- Admins manage all locations visually through the dashboard
- Venue changes reflect immediately on the map
- Students receive notifications when event venues change

---

## 2. Technologies Used

### Leaflet.js

**What it is:** A free, open-source JavaScript library for building interactive maps in the browser.

**Why we chose it:** Google Maps charges money after a certain number of API calls. Leaflet is completely free, lightweight (42KB), works on all devices, and supports everything needed — markers, popups, image overlays, route drawing, and zoom controls.

**What it does in CampusPulse:**
- Renders the campus map on screen
- Displays building markers loaded from the database
- Shows marker popups with event information
- Overlays floor plan images for indoor navigation
- Draws walking routes on the map

### OpenStreetMap (OSM)

**What it is:** A free community-edited world map, like Wikipedia but for maps.

**Why we chose it:** ASIET (Adi Shankara Institute of Engineering and Technology) is already fully mapped on OpenStreetMap with all buildings labeled — Main Block, MBA Block, Mechanical Block, Hostel, and Canteen. No custom map image is needed.

**What it does in CampusPulse:**
- Provides the base map tiles (the visual map background)
- Shows all ASIET campus buildings with correct labels
- Provides footpath data used by OpenRouteService for routing

### OpenRouteService (ORS)

**What it is:** A free, open-source routing API built on OpenStreetMap data.

**Why we chose it:** Google Maps Directions API charges per request. OpenRouteService is completely free, supports walking/cycling/driving modes, and provides turn-by-turn instructions.

**What it does in CampusPulse:**
- Receives start coordinates (student's GPS location) and end coordinates (building entrance)
- Calculates the shortest real walking path following actual campus footpaths
- Returns route geometry (the path coordinates to draw) and turn-by-turn instructions
- Provides total distance in metres and estimated walking time

### Leaflet Routing Machine (LRM)

**What it is:** A Leaflet plugin that handles route display and instructions.

**What it does in CampusPulse:**
- Connects to OpenRouteService to request route data
- Draws the route as a highlighted blue line on the Leaflet map
- Displays turn-by-turn instruction panel below the map
- Updates the student's position dot as they walk

### Amazon DynamoDB

**What it does in CampusPulse:**
- Stores all location records (name, coordinates, category, floor, indoor guide)
- Stores real-time RSVP counts for live seat availability
- Updates registered count every time a student RSVPs or cancels
- Serves data to the map frontend via Lambda API

### AWS Lambda + API Gateway

**What it does in CampusPulse:**
- Lambda functions handle all backend logic (fetch locations, update RSVP counts, save new locations)
- API Gateway exposes these functions as API endpoints the frontend calls
- No server management required — functions run only when called

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Student's Browser                     │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │  Leaflet.js  │    │  JavaScript  │                  │
│  │  (Map UI)    │◄───│  (App Logic) │                  │
│  └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                           │
│  ┌──────▼───────┐    ┌──────▼───────┐                  │
│  │   OSM Tiles  │    │  GPS / Geo-  │                  │
│  │  (Map Image) │    │  location    │                  │
│  └──────────────┘    └──────────────┘                  │
└───────────────────────────┬─────────────────────────────┘
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Amazon API Gateway                     │
└───────────────────────────┬─────────────────────────────┘
                            │ Triggers
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    AWS Lambda Functions                  │
│                                                         │
│  getLocations()    saveLocation()    getLiveCounts()    │
└───────────────────────────┬─────────────────────────────┘
                            │ Read / Write
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Amazon DynamoDB                       │
│                                                         │
│  Locations Table          Events Table                  │
│  (building data)          (RSVP counts)                 │
└─────────────────────────────────────────────────────────┘

External APIs:
┌──────────────────────────────────┐
│  OpenRouteService                │
│  (Walking route calculation)     │
└──────────────────────────────────┘
```

---

## 4. Database Design

### Locations Collection (DynamoDB)

Each campus location is stored as a document:

```json
{
  "_id": "loc001",
  "name": "Workshop Hall — Room 204",
  "building": "Main Block",
  "floor": 2,
  "roomNumber": "204",
  "category": "Event Hall",
  "latitude": 10.026453,
  "longitude": 76.312541,
  "description": "AI Workshop venue with projector and AC",
  "indoorGuide": "Enter main entrance → Take left staircase → Go to Floor 2 → Turn left → Third door on right",
  "floorPlanImage": "floorplans/mainblock_floor2.png",
  "buildingBoundsSW": [10.026200, 76.312300],
  "buildingBoundsNE": [10.026600, 76.312700],
  "markerIcon": "event-hall.png",
  "isActive": true,
  "createdBy": "admin001",
  "createdAt": "2024-09-01T10:00:00Z"
}
```

### Events Collection (DynamoDB)

Events reference locations by ID instead of storing venue name as plain text:

```json
{
  "_id": "event001",
  "title": "AI Workshop",
  "locationId": "loc001",
  "time": "10:00 AM",
  "date": "2024-10-15",
  "capacity": 150,
  "registered": 120,
  "clubId": "club001",
  "description": "Introduction to Machine Learning"
}
```

### Why locationId Instead of Venue Name?

If venue name is stored as plain text:
- "Workshop Hall", "workshop hall", "Wrkshp Hall Block B" — all different, all wrong
- Changing venue name means updating every event record manually

If locationId is used:
- One location record, referenced by many events
- Update the location once — all events automatically reflect the change
- Map always shows the correct, current coordinates

### Location Categories

```
Event Hall      → Orange marker
Building        → Blue marker
Food Stall      → Yellow marker
Parking         → Grey marker
Washroom        → Teal marker
Medical         → Red marker
Hostel          → Purple marker
Ground          → Green marker
```

---

## 5. Map Setup — Step by Step

### Step 1 — HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CampusPulse — Campus Map</title>

    <!-- Leaflet CSS -->
    <link rel="stylesheet"
        href="https://unpkg.com/leaflet/dist/leaflet.css" />

    <!-- Leaflet Routing Machine CSS -->
    <link rel="stylesheet"
        href="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.css" />

    <style>
        #campusMap {
            width: 100%;
            height: 100vh;
        }
    </style>
</head>
<body>
    <div id="campusMap"></div>

    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

    <!-- Leaflet Routing Machine JS -->
    <script src="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.js"></script>

    <script src="map.js"></script>
</body>
</html>
```

### Step 2 — Initialize the Map

```javascript
// map.js

// Center coordinates of ASIET campus
const CAMPUS_CENTER = [10.1823, 76.4142];

// Initialize Leaflet map
const map = L.map('campusMap', {
    minZoom: 16,   // cannot zoom out too far
    maxZoom: 20    // cannot zoom in past room level
}).setView(CAMPUS_CENTER, 18);

// Lock map to campus area — students cannot scroll away
const campusBounds = L.latLngBounds(
    [10.1810, 76.4128],  // SW corner
    [10.1840, 76.4158]   // NE corner
);
map.setMaxBounds(campusBounds);
```

### Step 3 — Add Map Layers

```javascript
// OpenStreetMap layer — ASIET buildings already visible here
const osmLayer = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 20
    }
);

// Satellite + Labels layer
const hybridLayer = L.tileLayer(
    'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    {
        attribution: '© Google',
        maxZoom: 21
    }
);

// Add OSM as default layer
osmLayer.addTo(map);

// Add layer toggle control (top right corner)
L.control.layers({
    '🗺 Street Map': osmLayer,
    '🛰 Satellite + Labels': hybridLayer
}).addTo(map);
```

---

## 6. Marker System

### Step 4 — Define Custom Icons per Category

```javascript
function getCategoryIcon(category) {
    const iconMap = {
        'Event Hall': 'icons/event-hall.png',
        'Building':   'icons/building.png',
        'Food Stall': 'icons/food.png',
        'Parking':    'icons/parking.png',
        'Washroom':   'icons/washroom.png',
        'Medical':    'icons/medical.png',
        'Hostel':     'icons/hostel.png',
        'Ground':     'icons/ground.png'
    };

    return L.icon({
        iconUrl:   iconMap[category] || 'icons/default.png',
        iconSize:  [32, 32],
        iconAnchor:[16, 32],   // anchor point at bottom center of icon
        popupAnchor:[0, -32]   // popup appears above marker
    });
}
```

### Step 5 — Load Markers from Database

```javascript
// Store all markers by location ID for later reference
const markers = {};

async function loadLocations() {
    // Fetch all active locations from backend API
    const response = await fetch('/api/locations', {
        headers: {
            'Authorization': `Bearer ${jwtToken}`
        }
    });
    const locations = await response.json();

    // Place a marker for each location
    locations.forEach(location => {
        const icon   = getCategoryIcon(location.category);
        const marker = L.marker(
            [location.latitude, location.longitude],
            { icon: icon }
        ).addTo(map);

        // Store for later reference
        markers[location._id] = marker;

        // Attach location data to marker
        marker.locationData = location;

        // Bind click handler
        marker.on('click', () => openMarkerPopup(marker, location));
    });
}

// Load when page is ready
loadLocations();
```

---

## 7. Popup with Event Details

### Step 6 — Fetch Events at a Location

```javascript
async function getEventsAtLocation(locationId) {
    const response = await fetch(
        `/api/events?locationId=${locationId}&upcoming=true`
    );
    return await response.json();
}
```

### Step 7 — Build and Open the Popup

```javascript
async function openMarkerPopup(marker, location) {
    const events = await getEventsAtLocation(location._id);

    // Build events HTML
    let eventsHTML = '';

    if (events.length === 0) {
        eventsHTML = '<p style="color:#888">No upcoming events here</p>';
    } else {
        events.forEach(event => {
            const seatsLeft = event.capacity - event.registered;
            const seatsColor = seatsLeft < 10 ? 'red' : 'green';

            eventsHTML += `
                <div class="event-item">
                    <strong>${event.title}</strong><br>
                    🕙 ${event.time} &nbsp;|&nbsp; 📅 ${event.date}<br>
                    Capacity: ${event.capacity} &nbsp;|&nbsp;
                    Seats Left:
                    <span id="seats-${event._id}"
                          style="color:${seatsColor}; font-weight:bold">
                        ${seatsLeft}
                    </span>
                    <div style="margin-top:8px">
                        <button onclick="startNavigation(
                            ${location.latitude},
                            ${location.longitude},
                            '${location._id}'
                        )">
                            🧭 Navigate
                        </button>
                        <button onclick="viewEvent('${event._id}')">
                            📋 Details
                        </button>
                    </div>
                    <hr>
                </div>
            `;
        });
    }

    // Full popup content
    const popupHTML = `
        <div class="map-popup" style="min-width:250px">
            <h3>${location.name}</h3>
            <p>
                📍 ${location.building} &nbsp;|&nbsp;
                🏢 Floor ${location.floor} &nbsp;|&nbsp;
                🚪 Room ${location.roomNumber}
            </p>
            <hr>
            ${eventsHTML}
        </div>
    `;

    marker.bindPopup(popupHTML, { maxWidth: 300 }).openPopup();
}
```

### Popup Appearance

```
┌──────────────────────────────────┐
│  Workshop Hall                   │
│  📍 Main Block | 🏢 Floor 2      │
│  🚪 Room 204                     │
│ ────────────────────────────────  │
│  AI Workshop                     │
│  🕙 10:00 AM | 📅 Oct 15         │
│  Capacity: 150 | Seats Left: 30  │
│                                  │
│  [🧭 Navigate]  [📋 Details]     │
└──────────────────────────────────┘
```

---

## 8. Live Seat Availability

### Step 8 — Poll Backend Every 10 Seconds

```javascript
function startLiveSeatUpdates() {
    setInterval(async () => {
        // Fetch latest counts for all upcoming events
        const response = await fetch('/api/events/live-counts');
        const counts   = await response.json();

        counts.forEach(item => {
            const element = document.getElementById(`seats-${item.eventId}`);
            if (element) {
                const seatsLeft = item.capacity - item.registered;
                element.textContent = seatsLeft;

                // Turn red when fewer than 10 seats remain
                element.style.color = seatsLeft < 10 ? 'red' : 'green';
            }
        });
    }, 10000); // every 10 seconds
}

startLiveSeatUpdates();
```

### How Backend Updates Work

```
Student clicks RSVP button
         ↓
Frontend calls POST /api/rsvp
         ↓
Lambda function runs:
  1. Checks if seats are available
  2. Increments registered count in DynamoDB
  3. Adds student to attendees list in RDS
  4. Triggers SNS reminder subscription
         ↓
DynamoDB registered count is now updated
         ↓
Next poll (within 10 seconds) fetches new count
         ↓
Popup seat count updates automatically
```

---

## 9. Outdoor Navigation

### Step 9 — Get Student's GPS Location

```javascript
function getStudentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject('GPS not supported on this device');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }),
            () => reject('Location access was denied')
        );
    });
}
```

### Step 10 — Draw Route Using OpenRouteService

```javascript
let currentRoute = null;

async function startNavigation(destLat, destLng, locationId) {
    try {
        // Get student's current GPS position
        const student = await getStudentLocation();

        // Remove any previously drawn route
        if (currentRoute) {
            map.removeControl(currentRoute);
        }

        // Store destination location for indoor switch later
        currentDestinationId = locationId;

        // Draw walking route using OpenRouteService via LRM
        currentRoute = L.Routing.control({
            waypoints: [
                L.latLng(student.lat, student.lng),  // student position
                L.latLng(destLat, destLng)            // building entrance
            ],
            router: L.Routing.openrouteservice(
                'YOUR_ORS_API_KEY',
                { profile: 'foot-walking' }           // walking mode
            ),
            routeWhileDragging: false,
            show: true,           // show instruction panel
            lineOptions: {
                styles: [{ color: '#3388ff', weight: 6 }]  // blue route line
            }
        }).addTo(map);

        // After route is found, start watching student's position
        currentRoute.on('routesfound', function(e) {
            const summary = e.routes[0].summary;
            console.log(`Distance: ${summary.totalDistance}m`);
            console.log(`Time: ${Math.round(summary.totalTime / 60)} min`);

            // Start watching for building arrival
            watchForBuildingArrival(destLat, destLng, locationId);
        });

    } catch (error) {
        alert(error);
    }
}
```

### What OpenRouteService Returns

```json
{
  "routes": [{
    "summary": {
      "distance": 180,
      "duration": 130
    },
    "segments": [{
      "steps": [
        {
          "instruction": "Head south on Campus Main Path",
          "distance": 80,
          "duration": 58
        },
        {
          "instruction": "Turn right toward Main Block",
          "distance": 60,
          "duration": 43
        },
        {
          "instruction": "Arrive at Main Block entrance",
          "distance": 40,
          "duration": 29
        }
      ]
    }]
  }]
}
```

### Turn-by-Turn Panel (Shown Below Map)

```
🧭 Walking to: Workshop Hall — Room 204
──────────────────────────────────────────
1.  Head south on Campus Main Path    80m
2.  Turn right toward Main Block      60m
3.  Arrive at Main Block entrance     40m
──────────────────────────────────────────
Total: 180m  |  ~2 min walk
```

---

## 10. Indoor Floor Plan Navigation

### Step 11 — Detect When Student Reaches Building

```javascript
let watchId = null;

function watchForBuildingArrival(buildingLat, buildingLng, locationId) {
    watchId = navigator.geolocation.watchPosition(position => {
        const studentLat = position.coords.latitude;
        const studentLng = position.coords.longitude;

        const distance = calculateDistance(
            studentLat, studentLng,
            buildingLat, buildingLng
        );

        // Student is within 20 metres of building entrance
        if (distance < 20) {
            navigator.geolocation.clearWatch(watchId);
            switchToIndoorNavigation(locationId);
        }
    });
}

// Haversine formula — calculates real distance between two GPS points
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R    = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a    = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                 Math.cos(lat1 * Math.PI / 180) *
                 Math.cos(lat2 * Math.PI / 180) *
                 Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

### Step 12 — Switch to Floor Plan View

```javascript
async function switchToIndoorNavigation(locationId) {
    // Fetch location details from backend
    const response = await fetch(`/api/locations/${locationId}`);
    const location = await response.json();

    // Remove outdoor route
    if (currentRoute) map.removeControl(currentRoute);

    // Remove OSM tile layer
    map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });

    // Define building bounds on the map
    const buildingBounds = [
        location.buildingBoundsSW,
        location.buildingBoundsNE
    ];

    // Overlay the floor plan image
    L.imageOverlay(
        location.floorPlanImage,  // e.g. "floorplans/mainblock_floor2.png"
        buildingBounds,
        { opacity: 0.92 }
    ).addTo(map);

    // Zoom into the building
    map.fitBounds(buildingBounds);

    // Add room marker on the floor plan
    L.marker([location.latitude, location.longitude])
        .addTo(map)
        .bindPopup(`
            <b>${location.name}</b><br>
            Floor ${location.floor} | Room ${location.roomNumber}
        `)
        .openPopup();

    // Show indoor directions panel
    showIndoorDirections(location);
}
```

### Step 13 — Show Indoor Text Directions

```javascript
function showIndoorDirections(location) {
    const panel = document.getElementById('navigationPanel');
    panel.innerHTML = `
        <div class="indoor-nav">
            <h3>📍 You have arrived at ${location.building}</h3>
            <p>Now navigate inside the building:</p>
            <div class="indoor-details">
                <span>🏢 Floor ${location.floor}</span>
                <span>🚪 Room ${location.roomNumber}</span>
            </div>
            <div class="indoor-steps">
                <h4>Step-by-Step Indoor Directions:</h4>
                <p>${location.indoorGuide}</p>
            </div>
        </div>
    `;
}
```

### Indoor Directions Panel Appearance

```
┌──────────────────────────────────────────┐
│  📍 You have arrived at Main Block        │
│                                          │
│  Now navigate inside:                    │
│  🏢 Floor 2  |  🚪 Room 204             │
│                                          │
│  Step-by-Step Indoor Directions:         │
│  Enter main entrance                     │
│  → Take the left staircase               │
│  → Go up to Floor 2                      │
│  → Turn left at the top                  │
│  → Third door on the right               │
│  → Room 204 — AI Workshop                │
└──────────────────────────────────────────┘
```

---

## 11. Admin Map Editor

### Step 14 — Enable Click-to-Place in Admin Dashboard

```javascript
let adminMarker   = null;
let selectedCoords = null;

function enableAdminMapEditor() {
    // Change cursor to crosshair to indicate click mode
    map.getContainer().style.cursor = 'crosshair';

    map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Remove previous temporary marker
        if (adminMarker) map.removeLayer(adminMarker);

        // Place a draggable marker at clicked position
        adminMarker = L.marker([lat, lng], {
            draggable: true
        }).addTo(map);

        // Store coordinates
        selectedCoords = { lat, lng };

        // Auto-fill the form fields
        document.getElementById('latInput').value = lat.toFixed(6);
        document.getElementById('lngInput').value = lng.toFixed(6);

        // Update if admin drags marker to adjust position
        adminMarker.on('dragend', function(event) {
            const pos = event.target.getLatLng();
            selectedCoords = { lat: pos.lat, lng: pos.lng };
            document.getElementById('latInput').value = pos.lat.toFixed(6);
            document.getElementById('lngInput').value = pos.lng.toFixed(6);
        });
    });
}
```

### Admin Dashboard — Add Location Form

```
┌─────────────────────────────────────────┐
│         ADD NEW LOCATION                │
├─────────────────────────────────────────┤
│  Location Name                          │
│  [________________________________]     │
│                                         │
│  Category          Building             │
│  [Event Hall ▼]    [______________]     │
│                                         │
│  Floor             Room Number          │
│  [___]             [___________]        │
│                                         │
│  Latitude          Longitude            │
│  [10.026453]       [76.312541]          │
│  (auto-filled when you click the map)   │
│                                         │
│  Description                            │
│  [________________________________]     │
│                                         │
│  Indoor Directions                      │
│  [________________________________]     │
│  [________________________________]     │
│                                         │
│  Floor Plan Image                       │
│  [Choose File]                          │
│                                         │
│  Marker Icon                            │
│  [Event Hall ▼]                         │
│                                         │
│  [        SAVE LOCATION        ]        │
└─────────────────────────────────────────┘
```

### Step 15 — Save Location to Backend

```javascript
async function saveLocation() {
    if (!selectedCoords) {
        alert('Please click on the map to place a marker first');
        return;
    }

    const locationData = {
        name:         document.getElementById('locName').value,
        category:     document.getElementById('category').value,
        latitude:     selectedCoords.lat,
        longitude:    selectedCoords.lng,
        building:     document.getElementById('building').value,
        floor:        parseInt(document.getElementById('floor').value),
        roomNumber:   document.getElementById('roomNumber').value,
        description:  document.getElementById('description').value,
        indoorGuide:  document.getElementById('indoorGuide').value,
        isActive:     true,
        createdBy:    currentAdminId
    };

    const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(locationData)
    });

    if (response.ok) {
        alert('Location saved. It now appears on the student map.');
        loadLocations(); // Reload markers on map
        resetAdminEditor();
    }
}
```

### Admin Location Management Dashboard

```
Locations
─────────────────────────────────────────────────────────
Name               Category      Building    Floor  Status
─────────────────────────────────────────────────────────
Workshop Hall      Event Hall    Main Block    2     Active
Computer Lab       Building      Main Block    3     Active
ASIET Canteen      Food Stall    Canteen       1     Active
Men's Hostel       Hostel        Hostel Block  —     Active
Medical Room       Medical       Admin Block   1     Active
─────────────────────────────────────────────────────────
[+ Add Location]

Each row has: [Edit] [Delete] [View on Map] buttons
```

---

## 12. List View and Map View Toggle

### Step 16 — Toggle Between Views

```javascript
function showListView() {
    document.getElementById('listView').style.display = 'block';
    document.getElementById('mapView').style.display  = 'none';
    document.getElementById('listBtn').classList.add('active');
    document.getElementById('mapBtn').classList.remove('active');
}

function showMapView() {
    document.getElementById('listView').style.display = 'none';
    document.getElementById('mapView').style.display  = 'block';
    document.getElementById('mapBtn').classList.add('active');
    document.getElementById('listBtn').classList.remove('active');

    // Required: Leaflet needs this when map container was hidden
    map.invalidateSize();
}
```

### Step 17 — Highlight Marker When Event is Clicked in List

```javascript
function highlightEventOnMap(locationId) {
    // Switch to map view
    showMapView();

    const marker = markers[locationId];
    if (marker) {
        // Pan and zoom to the marker
        map.setView(marker.getLatLng(), 19);

        // Simulate a click to open the popup
        marker.fire('click');
    }
}
```

### UI Toggle Buttons

```html
<div class="view-toggle">
    <button id="listBtn" onclick="showListView()" class="active">
        ☰ List View
    </button>
    <button id="mapBtn" onclick="showMapView()">
        🗺 Map View
    </button>
</div>
```

---

## 13. Multi-Floor Handling

### Why GPS Does Not Work Indoors

GPS relies on satellite signals. Inside buildings, these signals are blocked or reflected by walls, floors, and ceilings. Indoor GPS accuracy drops to 10–30 metres, which is useless for finding a specific room on a specific floor.

### The Two-Phase Solution

```
Phase 1 — OUTDOOR (GPS works fine)
Student's location → OpenRouteService → Walking route → Building entrance

Phase 2 — INDOOR (GPS unreliable)
Floor plan image overlay + Text directions → Exact room
```

### Floor Plan Switcher for Multi-Floor Buildings

```javascript
const floorPlans = {
    'main-block': {
        1: 'floorplans/mainblock_floor1.png',
        2: 'floorplans/mainblock_floor2.png',
        3: 'floorplans/mainblock_floor3.png',
        4: 'floorplans/mainblock_floor4.png'
    },
    'mba-block': {
        1: 'floorplans/mbablock_floor1.png',
        2: 'floorplans/mbablock_floor2.png',
        3: 'floorplans/mbablock_floor3.png'
    }
};

let currentFloorOverlay = null;

function showFloor(buildingId, floorNumber, buildingBounds) {
    // Remove current floor plan
    if (currentFloorOverlay) map.removeLayer(currentFloorOverlay);

    // Load the selected floor's plan image
    const imagePath = floorPlans[buildingId][floorNumber];

    currentFloorOverlay = L.imageOverlay(
        imagePath,
        buildingBounds,
        { opacity: 0.9 }
    ).addTo(map);

    map.fitBounds(buildingBounds);

    // Update active button in floor switcher UI
    document.querySelectorAll('.floor-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`floor-${floorNumber}`).classList.add('active');
}
```

### Floor Switcher UI (Appears When Inside Building)

```
┌──────────────────────────────┐
│  Select Floor:               │
│  [1] [2 ✓] [3] [4]          │
└──────────────────────────────┘
```

---

## 14. ASIET Campus Specific Setup

ASIET (Adi Shankara Institute of Engineering and Technology) is already fully mapped on OpenStreetMap. The following buildings are visible:

```
Building               OSM Status    Floors
──────────────────────────────────────────────
Main Block             ✓ Mapped       4
ASIET MBA Block        ✓ Mapped       3
ASIET Mechanical Block ✓ Mapped       3
ASIET Men's Hostel     ✓ Mapped       3
ASIET Canteen          ✓ Mapped       1
Sree Sankara Ground    ✓ Mapped       —
```

### ASIET Building Coordinates

Get the exact coordinates by:
1. Going to openstreetmap.org
2. Searching "Adi Shankara Institute of Engineering and Technology Kalady"
3. Right-clicking the center of each building
4. Copying the coordinates from the URL

### ASIET Map Initialization Code

```javascript
// ASIET campus center
const ASIET_CENTER = [10.1823, 76.4142];

// ASIET campus boundary
const ASIET_BOUNDS = L.latLngBounds(
    [10.1810, 76.4128],  // SW corner
    [10.1840, 76.4158]   // NE corner
);

const map = L.map('campusMap', {
    minZoom: 16,
    maxZoom: 20
}).setView(ASIET_CENTER, 18);

map.setMaxBounds(ASIET_BOUNDS);
```

### Why OpenStreetMap is Perfect for ASIET

Since ASIET is already mapped on OSM with all buildings labeled, there is no need to:
- Create a custom campus map image
- Manually draw building outlines
- Pay for any map service

The OSM tile layer loads the campus map automatically, completely free, with all building names already visible.

---

## 15. Complete Navigation Flow

### Full Student Journey from App Open to Room

```
STEP 1 — Student opens CampusPulse
└── S3 + CloudFront delivers the web app
└── Student authenticates via AWS Cognito (JWT issued)

STEP 2 — Student browses events
└── API Gateway → Lambda → RDS MySQL
└── Events list loaded with venue information

STEP 3 — Student switches to Map View
└── Leaflet.js initializes ASIET campus map
└── OSM tiles load (ASIET buildings visible)
└── API Gateway → Lambda → DynamoDB
└── Location markers loaded from database
└── Coloured markers placed on each building

STEP 4 — Student clicks marker on Main Block
└── Popup opens with event list
└── API fetches live seat counts from DynamoDB
└── Shows: AI Workshop | 10:00 AM | 30 seats left

STEP 5 — Student taps Navigate
└── Browser requests GPS permission
└── navigator.geolocation returns current coordinates
└── OpenRouteService API called with:
    Start: student's GPS location
    End:   Main Block entrance coordinates
    Mode:  foot-walking
└── ORS returns route geometry and instructions
└── Leaflet Routing Machine draws blue route line on map
└── Turn-by-turn instructions shown below map

STEP 6 — Student walks following the route
└── GPS watchPosition tracks movement
└── Student position dot moves along route
└── Distance to building calculated continuously

STEP 7 — Student reaches Main Block (within 20m)
└── watchPosition detects arrival
└── GPS watch cleared
└── App switches to indoor mode:
    - Outdoor route removed
    - OSM tiles removed
    - Floor 2 plan image overlaid on building bounds
    - Room 204 marked with destination pin
    - Indoor directions panel shown

STEP 8 — Student reads indoor directions
└── "Enter main entrance → Left staircase
     → Floor 2 → Turn left → Third door"
└── Student reaches Room 204

STEP 9 — Student RSVPs (if not done already)
└── POST /api/rsvp
└── Lambda updates DynamoDB registered count
└── SNS subscribes student to event reminders
└── Seat count in all popups updates within 10 seconds

STEP 10 — Day before event
└── Lambda scheduled trigger fires
└── SNS sends email + SMS reminder to all registered students
└── Notification includes event name, time, and venue
```

---

## 16. Viva Questions and Answers

**Q: What is the map feature in CampusPulse?**

"The Interactive Campus Event Navigator is a Leaflet.js powered map that shows all ASIET buildings as clickable markers. Students can see events at each location, check live seat availability, and get walking directions to any venue. Navigation works in two phases — outdoor routing via OpenRouteService and indoor floor plan guidance."

---

**Q: Why Leaflet instead of Google Maps?**

"Google Maps charges money beyond a free usage limit. For a college project with hundreds of students, this would become expensive. Leaflet is completely free and open-source. OpenStreetMap, which Leaflet uses, already has all ASIET buildings mapped, so there is no extra setup needed."

---

**Q: How does navigation work?**

"When a student taps Navigate, the browser's GPS captures their current location. OpenRouteService receives the student's coordinates and the building entrance coordinates, calculates the shortest walking path following real campus footpaths, and returns the route. Leaflet Routing Machine draws this as a blue line on the map with turn-by-turn instructions."

---

**Q: How do you handle multi-floor buildings?**

"GPS does not work reliably inside buildings so we handle it in two phases. Outdoor navigation takes the student to the building entrance. When they arrive within 20 metres, the app switches to indoor mode, showing a floor plan image uploaded by the admin. The correct floor is highlighted automatically and text directions guide the student to the exact room."

---

**Q: How are markers loaded on the map?**

"Markers are not hardcoded in the frontend. Admins save location records in DynamoDB with GPS coordinates, building, floor, and category. When the map loads, the frontend calls our API which fetches all active locations and places markers dynamically. When an admin adds a new location from the dashboard, it appears on the map immediately."

---

**Q: How does the admin add locations?**

"The admin goes to the Locations section in the dashboard. They click directly on the campus map and Leaflet automatically captures the latitude and longitude of that click. The admin fills in the name, category, building, floor, room, indoor directions, and floor plan image, then saves. No code changes are needed."

---

**Q: How does live seat availability work?**

"Each marker popup shows seats remaining. The frontend polls the backend every 10 seconds for updated RSVP counts. Every time a student RSVPs or cancels, the Lambda function updates the registered count in DynamoDB. The next poll fetches this new count and updates the popup automatically. When fewer than 10 seats remain the number turns red."

---

**Q: What happens when a venue changes?**

"When an admin updates a location, all events linked via locationId automatically reflect the new coordinates on the map. AWS SNS sends notifications to all registered students with the old and new venue details and a link to open the updated location on the map."

---

**Q: Why store locationId in events instead of venue name?**

"Storing a venue name as plain text causes inconsistency — different admins might type Workshop Hall, workshop hall, or Wrkshp Hall differently. By storing a locationId reference, all events point to one location record. If the location is updated, every event linked to it reflects the change automatically. The map always shows the correct, current position."

---

**One Ultimate Answer (If Teacher Asks Everything Together):**

"Our map uses Leaflet.js with OpenStreetMap as the base. Since ASIET is already mapped on OpenStreetMap, all buildings appear automatically without any custom image. Location markers are loaded dynamically from DynamoDB so admins can add or edit locations from the dashboard without touching code. Clicking a marker shows event details and live seat counts updated every 10 seconds. Navigation works in two phases — OpenRouteService handles outdoor walking directions to the building entrance, and floor plan image overlays handle indoor navigation since GPS is unreliable inside buildings. The entire map system is free, serverless, and requires no special hardware."

---

*Document prepared for CampusPulse — Academic Year 2024–2025*
*Adi Shankara Institute of Engineering and Technology*
