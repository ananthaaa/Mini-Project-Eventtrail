## ADDED Requirements

### Requirement: Indoor Step Tracker
The system SHALL display the predefined list of indoor steps upon entering the indoor navigation phase.

#### Scenario: Handoff completion
- **WHEN** the geofence triggers the indoor phase
- **THEN** the indoor step panel slides into view with the first step active.

### Requirement: Step Completion
The system SHALL allow students to check off steps sequentially as they navigate indoors.

#### Scenario: Completing a step
- **WHEN** the student clicks "Done" on the active step
- **THEN** the step is marked complete, and the next step is activated.

### Requirement: Final Arrival Confirmation
The system SHALL display a success confirmation when all indoor steps are marked complete.

#### Scenario: Arriving at the room
- **WHEN** the student completes the final indoor step
- **THEN** an arrival confirmation screen is displayed, and the destination pin turns green.
