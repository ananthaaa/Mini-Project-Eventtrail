## ADDED Requirements

### Requirement: Immersive AR simulation camera view
The system SHALL provide an AR Simulation view mode that sets camera pitch to 85 degrees and elevates camera altitude to an eye-level height of 1.7 meters using `FreeCameraOptions`.

#### Scenario: Engaging AR simulation mode
- **WHEN** the user switches to AR Simulation mode near their destination
- **THEN** the camera lowers to eye level (1.7m) at 85° pitch, creating a first-person ground-level perspective

### Requirement: Holographic 3D buildings and neon extruded paths
The system SHALL render 3D building extrusions with high emissive strength (`fill-extrusion-emissive-strength: 1.0`) and render the active walkway path as a 3D neon corridor extruded 2 meters wide using `@turf/buffer`.

#### Scenario: Rendering holographic arrival environment
- **WHEN** AR Simulation mode is active
- **THEN** campus buildings appear glowing/holographic and the walkway path renders as a bright 3D neon ribbon leading to the destination pin

### Requirement: Custom atmospheric fog styling
The system SHALL configure atmospheric fog with horizon blending and dark night/space colors (`#0d1b2a` and `#000814`) to enhance immersion and depth during AR Simulation mode.

#### Scenario: Displaying atmospheric fog
- **WHEN** AR Simulation mode is rendered
- **THEN** the horizon blends into a custom dark starry atmosphere surrounding the campus model
