## ADDED Requirements

### Requirement: Fetch Events
The system SHALL retrieve live event data from the backend API (backed by RDS MySQL) instead of local JSON.

#### Scenario: Load Event Discovery
- **WHEN** the user navigates to the Events page
- **THEN** the system fetches the list of events and displays them

### Requirement: Manage RSVPs
The system SHALL post RSVP and waitlist requests to the backend API (backed by DynamoDB).

#### Scenario: Successful RSVP
- **WHEN** the user clicks RSVP on an event with open seats
- **THEN** the backend persists the RSVP and returns a success confirmation

### Requirement: Asset Uploads
The system SHALL use presigned URLs to upload Venue SVGs to S3.

#### Scenario: Admin Uploads Venue Map
- **WHEN** the admin uploads an SVG in the venue form
- **THEN** the file is uploaded directly to S3 and its CloudFront URL is saved to the venue record
