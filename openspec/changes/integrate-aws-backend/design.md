## Context

CampusPulse was built as a UI reference using mock JSON data, local component state, and a simple toggle for roles (Student vs Admin). To support actual usage, we need a robust, serverless AWS backend. This design covers integrating AWS Cognito (auth), API Gateway / Lambda to RDS MySQL (Events) & DynamoDB (RSVPs), S3/CloudFront (Asset Storage), SNS (Notifications), and the OpenRouteService API (Live GPS routing).

## Goals / Non-Goals

**Goals:**
- Replace the mock state layer with real data-fetching implementations.
- Implement robust JWT authentication using AWS Cognito.
- Connect Map capabilities to the live OpenRouteService API.
- Keep the existing UI design system (Framer-style neo-brutalist) fully intact.

**Non-Goals:**
- Modifying the visual design system or UI layouts.
- Backend infrastructure-as-code (Terraform/CDK). This design focuses on the frontend's integration with the assumed existing backend infrastructure.

## Decisions

- **Amplify vs AWS SDK**: Use `aws-amplify` for integrating Cognito to handle session management and token refreshes smoothly out of the box.
- **Data Fetching**: Use `@tanstack/react-query` to manage caching, background fetching, and loading states, replacing raw React `useContext`/`useState` combinations.
- **Routing API**: OpenRouteService will be called from the frontend or via a proxy Lambda. To protect the API key, the call will route through an API Gateway endpoint.
- **Image/SVG Upload**: Direct-to-S3 presigned URLs fetched from our backend API to avoid sending large files through Lambda.

## Risks / Trade-offs

- **[Risk] S3 Upload Latency** → Pre-signed URLs will allow direct client-to-S3 uploads, keeping Lambda payloads small and fast.
- **[Risk] OpenRouteService Rate Limits** → The frontend will cache coordinates and debounce GPS updates to prevent spamming the routing API.
- **[Risk] Context Refactoring Complexity** → The entire `NavModeContext` and `RsvpContext` must be gutted. We will isolate the data fetching to custom hooks (`useEvents`, `useRSVP`) to keep the components clean.
