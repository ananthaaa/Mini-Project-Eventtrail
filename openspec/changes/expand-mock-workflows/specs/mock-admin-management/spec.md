## ADDED Requirements

### Requirement: Admin Event Roster Management
The system SHALL allow admins to view and manage event attendees.

#### Scenario: Viewing the Roster
- **WHEN** an admin clicks an event in the dashboard
- **THEN** they see a list of RSVP'd users and a list of Waitlisted users

### Requirement: Admin Venue Management
The system SHALL allow admins to view and delete venues.

#### Scenario: Deleting a Venue
- **WHEN** an admin clicks "Delete" on a venue in the Venue List
- **THEN** the venue is removed from the mock state

### Requirement: Event Deletion
The system SHALL allow admins to delete events.

#### Scenario: Deleting an Event
- **WHEN** an admin clicks "Delete Event"
- **THEN** the event is removed from the mock state and the dashboard updates
