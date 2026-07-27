## ADDED Requirements

### Requirement: Admin Map Venue Picker
The system SHALL provide an interactive Leaflet map within the Create Event and Venue Setup forms allowing the admin to click and place a draggable marker for the building entrance.

#### Scenario: Dropping the entrance pin
- **WHEN** the admin clicks on the Leaflet map
- **THEN** a draggable marker is placed, and its coordinates are stored in the local component state.

### Requirement: Indoor Steps Editor
The system SHALL provide a dynamic list editor to allow admins to add, remove, and edit text-based steps for indoor directions from the entrance to the room.

#### Scenario: Adding an indoor step
- **WHEN** the admin clicks "Add another step"
- **THEN** a new text input is appended to the indoor steps list array.
