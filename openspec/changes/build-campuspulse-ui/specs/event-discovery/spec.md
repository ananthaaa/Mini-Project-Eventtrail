## ADDED Requirements

### Requirement: event-discovery-list
The system SHALL display a list of events with details including cover image, title, date, time, faculty, category, and organizer name.

#### Scenario: Event discovery listing
- **WHEN** the user navigates to the Event Discovery page
- **THEN** the system SHALL render cards for all available events.

### Requirement: event-filtering
The system SHALL support filtering of events using neobrutalist bordered tabs/filters for date (e.g., "Today", "This Week", "By Faculty"), category, and faculty.

#### Scenario: Filtering events by date
- **WHEN** the user selects the "Today" tab
- **THEN** the system SHALL display only events scheduled for the current date.

### Requirement: event-detail-view
The system SHALL display a detailed page for any selected event, displaying the event schedule timeline, organizer club card, cover image, and seat status.

#### Scenario: Navigating to event details
- **WHEN** the user clicks on an event card
- **THEN** the system SHALL navigate to the Event Detail page and render the event schedule and organizer section.
