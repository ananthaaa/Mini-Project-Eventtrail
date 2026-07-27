## ADDED Requirements

### Requirement: Landing page is a standalone public marketing page
The system SHALL render a dedicated `LandingPage` at the `/` route that is completely independent from the student and admin application shells. It SHALL NOT render the app's `NavBar` or `Footer` components.

#### Scenario: User visits root URL
- **WHEN** an unauthenticated user navigates to `/`
- **THEN** the landing page is shown with its own full-screen layout (no app NavBar or Footer)

### Requirement: Landing page communicates the app's value proposition
The landing page SHALL contain a hero section with a headline, sub-headline, and at least two CTA buttons: one to login and one to sign up.

#### Scenario: Hero section visible on load
- **WHEN** the landing page renders
- **THEN** a hero section with headline text describing the product and two visible CTA buttons ("Login" and "Get Started") is displayed above the fold

### Requirement: Landing page includes a feature highlights section
The landing page SHALL include a section listing the core features of CampusPulse: event discovery, RSVP, and indoor navigation.

#### Scenario: Feature cards visible
- **WHEN** the user scrolls down the landing page
- **THEN** at least three feature highlight cards/sections describing Discover, RSVP, and Navigate are visible

### Requirement: Landing page CTAs link to login and signup
The "Login" CTA SHALL navigate to `/login`. The "Get Started" CTA SHALL navigate to `/signup`.

#### Scenario: Login CTA clicked
- **WHEN** user clicks the "Login" CTA on the landing page
- **THEN** the user is navigated to `/login`

#### Scenario: Get Started CTA clicked
- **WHEN** user clicks the "Get Started" CTA on the landing page
- **THEN** the user is navigated to `/signup`
