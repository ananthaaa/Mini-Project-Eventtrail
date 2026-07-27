## ADDED Requirements

### Requirement: Interactive Outdoor Map
The system SHALL display an interactive Leaflet map when the student begins navigation, centered on the destination building entrance coordinates.

#### Scenario: Initialization
- **WHEN** the student triggers "Take Me There"
- **THEN** the map renders with the student's mock starting location and the destination pin.

### Requirement: Outdoor Path and Distance Simulation
The system SHALL simulate a walking route by interpolating coordinates and calculate the Haversine distance from the student's mock location to the destination.

#### Scenario: Student moves toward destination
- **WHEN** the simulation interval ticks
- **THEN** the student's blue dot moves along the path and the distance badge updates.

### Requirement: Geofence Trigger
The system SHALL transition automatically to the indoor navigation phase when the Haversine distance is 30 meters or less.

#### Scenario: Arriving at the entrance
- **WHEN** the calculated distance is <= 30m
- **THEN** the system switches to indoor mode and hides the outdoor path.
