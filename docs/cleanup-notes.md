# Phase 0 Cleanup Notes — Technical Debt & Audit Findings

During the Phase 0 repository audit, several structural quirks and duplicate component patterns were identified. Per Phase 0 rules, no frontend behavior or visual design was modified. This document logs these items so they can be systematically addressed during the backend integration phases (Modules 1–8).

---

## 1. Duplicate / Parallel Navigation UI Components

There are currently two distinct sets of map and navigation components in `src/components/`:

1. **UI Reference Components (`/src/components/ui/`)**
   - `CampusMap.jsx` and `RouteLayer.jsx`
   - Used by: `StudentEventMap.jsx`, `StudentDashboard.jsx`, `FullCampusMap.jsx`, `Navigate.jsx`, `AdminVenueUpload.jsx`, `AdminEventForm.jsx`.
   - These represent the earlier UI reference build.

2. **Progressive Navigation Module Components (`/src/components/navigation/`)**
   - `CampusMap.jsx` and `RouteLayer.jsx` (along with `ARMarkers.jsx`, `BuildingLayer.jsx`, `ModeToggle.jsx`, `TurnByTurnPanel.jsx`, `UserLocationMarker.jsx`).
   - Used by: `NavigateToVenue.jsx`.
   - These implement the progressive 4-mode camera navigation (2D, Route Overview, Turn-by-Turn, AR Simulation) using MapLibre GL JS.

### Recommendation for Backend Modules
When implementing live API data in Module 3 and live navigation in later modules, ensure both paths are evaluated or unified so that event detail screens and dashboard cards route cleanly to the canonical navigation experience without code duplication.

---

## 2. Duplicate / Parallel A* Pathfinding Algorithms

In `src/utils/`, two separate files implement client-side A* pathfinding over campus walkway graphs:

1. **`pathfinding.js`**
   - Implements `buildAdjacencyList` and `findPathAStar`.
   - Used by: `FullCampusMap.jsx` and `Navigate.jsx`.

2. **`astar.js`**
   - Implements `runAStar` and `haversine`.
   - Used by: `NavigateToVenue.jsx` and `useDriftDetection.js`.

### Recommendation for Backend Modules
During Module 1 (Infrastructure Foundation & Data Layer) and Module 3 (Public Read API), consolidate pathfinding utilities into a single canonical solver that ingests the live graph from the `PathNodes` and `PathEdges` DynamoDB tables.

---

## 3. Seed Script Scope (`src/scripts/seedDynamoDB.js`)

An existing script `src/scripts/seedDynamoDB.js` currently contains logic to seed only the `PathNodes` and `PathEdges` tables from `src/data/graph.json`. 

### Recommendation for Module 1
In Module 1, create a comprehensive seed script inside `/infra/scripts/` (or update this script) to populate all 7 DynamoDB tables (`Users`, `Clubs`, `Events`, `Venues`, `Speakers`, `PathNodes`, `PathEdges`) directly from the existing mock JSON files in `/src/data/` without manual edits.
