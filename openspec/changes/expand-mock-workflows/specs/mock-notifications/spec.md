## ADDED Requirements

### Requirement: Simulated System Notifications
The system SHALL display simulated SMS/Email notifications as in-app toasts when key events occur.

#### Scenario: RSVP Notification
- **WHEN** a student successfully RSVPs to an event
- **THEN** a toast notification appears simulating a confirmation SMS

#### Scenario: Geofence Notification
- **WHEN** the student triggers the geofence arrival in the Navigation view
- **THEN** a toast notification appears simulating a welcome email or check-in alert
