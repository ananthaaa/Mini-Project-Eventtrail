## ADDED Requirements

### Requirement: Mapbox Tile Layer
The system SHALL display interactive campus maps using Mapbox GL with the custom style `mapbox://styles/ananthakrishnanaca/cms0kbfy500o901qk07sm6tdc` as the base layer.

#### Scenario: User opens a map view
- **WHEN** the user navigates to any campus map screen
- **THEN** the system renders a Mapbox GL map configured with style `mapbox://styles/ananthakrishnanaca/cms0kbfy500o901qk07sm6tdc` centered on the campus

### Requirement: Dedicated Full Campus Map Page
The system SHALL provide a dedicated full campus map page for comprehensive outdoor navigation and campus exploration.

#### Scenario: User accesses full campus map
- **WHEN** the user navigates to the dedicated full campus map page
- **THEN** the system renders the complete outdoor campus map with navigation controls and building outlines

### Requirement: Dedicated Student Event Map Page
The system SHALL provide a dedicated student event map page where students can view admin-marked events plotted on the campus map and inspect event information.

#### Scenario: Student views admin-marked events on the map
- **WHEN** a student opens the dedicated student event map page
- **THEN** the system retrieves admin-marked campus events and plots them as interactive markers on the Mapbox map

#### Scenario: Student inspects event details
- **WHEN** the student clicks or taps on an event marker on the student event map
- **THEN** the system displays a popover or modal showing detailed information about that event

### Requirement: Geofence Bridge Points
The system SHALL define building entrances as distinct nodes on the map that act as handoff points for future indoor navigation.

#### Scenario: User approaches a building
- **WHEN** the user's GPS coordinates intersect with a bridge point node
- **THEN** the system exposes the transition event to trigger indoor navigation rendering
