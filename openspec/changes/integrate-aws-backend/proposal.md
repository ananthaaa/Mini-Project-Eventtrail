## Why

Currently, the CampusPulse application is a purely front-end UI reference build relying on mock JSON files and local component state. To transition this to a fully functional, production-ready application, we need to integrate the actual AWS Serverless architecture and third-party APIs defined in the system diagrams (Cognito, RDS MySQL, DynamoDB, S3, SNS, and OpenRouteService).

## What Changes

- **Authentication**: Replace the mock `RoleContext` UI toggle with AWS Cognito for real student and admin authentication.
- **Data Persistence**: Remove all mock JSON data files (`mockEvents.json`, `mockVenues.json`, etc.) and replace them with API fetch hooks communicating with RDS MySQL (for events) and DynamoDB (for RSVPs and Waitlists).
- **File Storage**: Migrate the venue map SVG upload functionality from local component state to AWS S3, serving assets via CloudFront.
- **Live Navigation**: Replace the simulated timer-based outdoor navigation progress with real routing coordinates fetched from the OpenRouteService API.
- **Notifications**: Implement triggers for AWS SNS to dispatch real email and SMS confirmations upon RSVP and waitlist actions.

## Capabilities

### New Capabilities
- `aws-auth`: Integration with AWS Cognito for user registration, login, and JWT-based session management for Students and Admins.
- `backend-api`: Data layer replacing mock state, handling CRUD operations for Events (RDS) and RSVPs (DynamoDB).
- `live-navigation`: Outdoor mapping and routing integration via OpenRouteService API.

### Modified Capabilities
- (None - existing features are being implemented against a real backend rather than modified in core requirement)

## Impact

- **Context Providers**: `RoleContext`, `RsvpContext`, and `NavModeContext` will be heavily refactored or replaced by robust data-fetching solutions (like React Query or SWR) and Auth Providers.
- **Dependencies**: New dependencies such as `aws-amplify` (or `@aws-sdk/client-cognito-identity-provider`) and data fetching libraries will be added to `package.json`.
- **UI Components**: UI components will remain visually identical but will be wired to real asynchronous hooks, requiring loading and error state handling.
