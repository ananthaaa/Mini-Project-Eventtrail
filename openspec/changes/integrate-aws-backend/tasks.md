## 1. Setup & Configuration

- [ ] 1.1 Install `aws-amplify` and `@tanstack/react-query`
- [ ] 1.2 Configure AWS Amplify in `src/main.jsx` with the Cognito user pool details
- [ ] 1.3 Wrap the application in a `QueryClientProvider` in `src/main.jsx`

## 2. Authentication Integration

- [ ] 2.1 Refactor `RoleContext` to use Amplify's `getCurrentUser` and `fetchAuthSession`
- [ ] 2.2 Update `NavBar.jsx` to render conditionally based on real Auth state instead of the UI toggle
- [ ] 2.3 Update `StudentProfile.jsx` to handle real login flow and display actual user attributes

## 3. Data Fetching Hooks

- [ ] 3.1 Create `src/api/useEvents.js` to fetch events from the backend API gateway
- [ ] 3.2 Create `src/api/useRSVP.js` to handle POST requests for RSVP and waitlist actions
- [ ] 3.3 Create `src/api/useVenueUpload.js` to fetch S3 presigned URLs

## 4. UI Data Integration

- [ ] 4.1 Delete local mock files in `src/data/`
- [ ] 4.2 Update `EventDiscovery.jsx` and `EventDetail.jsx` to consume the `useEvents` hook
- [ ] 4.3 Refactor `RsvpContext.jsx` logic into `useRSVP`, updating `EventDetail` and `RsvpConfirmation` components
- [ ] 4.4 Update `AdminEventForm.jsx` to submit event creation to the backend API
- [ ] 4.5 Update `AdminVenueUpload.jsx` to upload SVG floor plans to S3 via presigned URLs

## 5. Live Navigation Integration

- [ ] 5.1 Integrate the OpenRouteService API in `Navigate.jsx` to calculate realistic outdoor walking times/polylines
- [ ] 5.2 Implement the browser Geolocation API in `Navigate.jsx` to track real progress and trigger the indoor handoff automatically
