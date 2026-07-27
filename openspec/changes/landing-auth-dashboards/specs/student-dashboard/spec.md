## ADDED Requirements

### Requirement: Student dashboard is the landing page after student login
The system SHALL render `StudentDashboard` at `/student` (index route) as the first page a student sees after logging in.

#### Scenario: Student navigates to /student after login
- **WHEN** a logged-in student navigates to `/student`
- **THEN** the StudentDashboard is displayed inside the StudentLayout shell

### Requirement: Personalized welcome panel
The dashboard SHALL display a personalized welcome message using the logged-in student's name from `RoleContext`.

#### Scenario: Welcome message displays user name
- **WHEN** a student with name "Alex" views the dashboard
- **THEN** the welcome panel shows text including the student's name (e.g., "Welcome back, Alex!")

### Requirement: Upcoming RSVPs section
The dashboard SHALL display a section showing events the student has RSVP'd for, sourced from `RsvpContext`. If no RSVPs exist, a helpful empty state SHALL be shown.

#### Scenario: Student has RSVPs
- **WHEN** the student has RSVP'd for one or more events
- **THEN** upcoming RSVP cards are shown with event title, date, and venue

#### Scenario: Student has no RSVPs
- **WHEN** the student has no RSVPs
- **THEN** an empty state message encouraging event discovery is shown

### Requirement: Recommended events section
The dashboard SHALL display a section of recommended events — events from the mock data that the student has NOT yet RSVP'd for.

#### Scenario: Recommended events visible
- **WHEN** the dashboard loads
- **THEN** at least 3 event cards are shown in the "Recommended Events" section for events the student has not RSVP'd for
