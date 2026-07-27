## ADDED Requirements

### Requirement: admin-dashboard-stats
The system SHALL display an Admin Dashboard containing metrics for all events, including active RSVPs and waitlist numbers.

#### Scenario: Navigating to the Admin Dashboard
- **WHEN** the user switches the role toggle in the navbar to "Admin"
- **THEN** the system SHALL display the Admin Dashboard with card tiles containing event statistics.

### Requirement: admin-create-event-form
The system SHALL provide a form to input details for creating a new event, adding the event to the in-memory dataset on submission.

#### Scenario: Creating a new event
- **WHEN** the admin submits the Event Form with a title and seat capacity
- **THEN** the system SHALL add the event to the local in-memory event state and navigate to the dashboard.

### Requirement: admin-venue-floorplan-upload
The system SHALL offer an interface to mock floor plan uploads and define navigation waypoints.

#### Scenario: Configuring venue navigation waypoints
- **WHEN** the admin uploads an image and adds waypoint steps in the editor
- **THEN** the system SHALL save the configuration in-memory and update the list of navigated waypoints.
