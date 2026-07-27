## ADDED Requirements

### Requirement: rsvp-status-tracking
The system SHALL maintain in-memory RSVP status (e.g., Not RSVP'd, RSVP'd, Waitlisted) and update the local event capacity on seat booking.

#### Scenario: Submitting a successful RSVP
- **WHEN** the user clicks the RSVP button on an event with available seats
- **THEN** the system SHALL update the user's status to RSVP'd and deduct one seat from the event capacity.

### Requirement: rsvp-seat-meter-animation
The system SHALL display an animated progress bar indicating remaining seat availability.

#### Scenario: Visualizing seat meter
- **WHEN** the user views the Event Detail page
- **THEN** the system SHALL animate the progress bar from zero to the percentage of seats occupied.

### Requirement: rsvp-waitlist
The system SHALL handle waitlist status when event capacity is zero.

#### Scenario: RSVPing to a full event
- **WHEN** the user clicks the RSVP button on an event with zero remaining seats
- **THEN** the system SHALL update the status to waitlisted and display a waitlist banner on the confirmation screen.

### Requirement: rsvp-ticket-visual
The system SHALL present a styled ticket-card visualization upon successful RSVP, containing the seat number and "what's next" checklist.

#### Scenario: Viewing ticket confirmation
- **WHEN** the user completes a successful RSVP
- **THEN** the system SHALL show the confirmation page with a ticket mockup and checklist.
