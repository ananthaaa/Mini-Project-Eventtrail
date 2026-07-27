## ADDED Requirements

### Requirement: Single map instance view modes
The system SHALL provide four progressive camera view modes on a single map instance (`CampusMap`) for campus navigation: 2D Map (pitch 0°), Route Overview (pitch 45°), Turn-by-Turn (pitch 60° with 3D buildings), and AR Simulation (pitch 85° at eye-level).

#### Scenario: Switching between view modes
- **WHEN** the user selects a view mode from the mode toggle component
- **THEN** the single map instance smoothly interpolates its camera pitch, zoom, and bearing without unmounting or reloading map tiles

### Requirement: Didasko styled navigation UI chrome
The system SHALL wrap all navigation overlays and controls (mode toggle, turn-by-turn panel, ETA card) in Didasko neo-brutalist styling featuring hard 2px black borders, offset box shadows, and primary accent colors.

#### Scenario: Rendering navigation controls
- **WHEN** the navigation module is displayed
- **THEN** all surrounding UI elements exhibit hard borders and offset shadows consistent with the EventTrail design system
