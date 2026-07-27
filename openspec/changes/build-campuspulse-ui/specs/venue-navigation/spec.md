## ADDED Requirements

### Requirement: outdoor-navigation-simulation
The system SHALL display a simulated outdoor navigation screen with a map placeholder, mock polyline route, and distance/time badges.

#### Scenario: Launching navigation
- **WHEN** the user triggers navigation from a ticket confirmation
- **THEN** the system SHALL render the outdoor map screen showing walking status.

### Requirement: geofence-arrival-trigger
The system SHALL provide a simulated geofence trigger to switch from outdoor navigation to indoor navigation.

#### Scenario: Reaching the geofence boundary
- **WHEN** the user clicks the "Simulate Arrival" button
- **THEN** the system SHALL show an arrival notification toast and switch the navigation view to the indoor floor plan.

### Requirement: indoor-navigation-steps
The system SHALL render an SVG-based floor plan and display numbered directions in a step-by-step tracker.

#### Scenario: Indoor waypoint tracking
- **WHEN** the indoor navigation page renders
- **THEN** the system SHALL display the SVG floor plan and list numbered directions matching the waypoint steps.
