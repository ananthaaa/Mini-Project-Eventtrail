## ADDED Requirements

### Requirement: Live Route Calculation
The system SHALL calculate the walking route to a venue using the OpenRouteService API.

#### Scenario: Initializing Navigation
- **WHEN** the user taps "Navigate to Venue"
- **THEN** the system fetches the polyline route from their current GPS coordinates to the venue coordinates

### Requirement: GPS Tracking
The system SHALL track the user's real outdoor location to update progress.

#### Scenario: Geofence Trigger
- **WHEN** the user's live GPS coordinates cross the venue's geofence boundary
- **THEN** the system automatically hands off to the Indoor SVG navigation phase
