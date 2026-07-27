## ADDED Requirements

### Requirement: Real-time geolocation tracking with path snapping
The system SHALL track the user's live GPS location using `navigator.geolocation.watchPosition` and snap the displayed user marker to the nearest point on the active route network using `@turf/nearest-point-on-line`.

#### Scenario: Displaying user location on map
- **WHEN** GPS position updates are received from the mobile device
- **THEN** the user location marker is projected onto the nearest walkway point rather than jumping erratically across raw GPS coordinates

### Requirement: Real-time compass heading and orientation
The system SHALL track mobile device orientation via `deviceorientationabsolute` (requesting permission on iOS Safari upon user interaction) to orient the user marker and rotate the map bearing in turn-by-turn and AR modes.

#### Scenario: Rotating map camera to match user heading
- **WHEN** the user walks and turns with their device in turn-by-turn mode
- **THEN** the map camera bearing updates to align with the user's real-time physical orientation

### Requirement: Geofence handoff to indoor navigation
The system SHALL detect when the user's snapped location enters a building's geofence radius and automatically unmount outdoor campus navigation to transition into existing indoor SVG floor-plan guidance.

#### Scenario: Arriving at building entrance
- **WHEN** the user's snapped GPS position enters the geofence radius of the destination venue building
- **THEN** outdoor navigation ends and indoor floor-plan directions are presented automatically
