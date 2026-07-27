## ADDED Requirements

### Requirement: User Registration and Authentication
The system SHALL allow users (Students and Admins) to authenticate using AWS Cognito.

#### Scenario: Successful Student Login
- **WHEN** a user provides valid credentials
- **THEN** they receive a JWT and are logged into the student role

#### Scenario: Successful Admin Login
- **WHEN** a user with admin group policies logs in
- **THEN** the system grants access to the Admin Dashboard

### Requirement: Token Management
The system SHALL automatically refresh JWT tokens to maintain active sessions and attach them to API requests.

#### Scenario: API Request Authorization
- **WHEN** the frontend makes a request to the backend API
- **THEN** the JWT token is included in the Authorization header
