## 1. Project Setup and Configuration

- [x] 1.1 Initialize a React + Vite app in the workspace root if not already done, and install Tailwind CSS, React Router DOM, Framer Motion, and Lucide React.
- [x] 1.2 Configure `tailwind.config.js` to include the Didasko neobrutalist design tokens (custom background `#F9F5F6`, text `#000000`, Epilogue/Inter font stacks, mustard yellow accent `#FFDB58`, pastel card colors, 3px solid black borders, and hard drop shadows).
- [x] 1.3 Update `src/index.css` to define CSS variables for the color palette, fonts, global neobrutalist styles, dotted grid background pattern overlay, and marquee animation keyframes.

## 2. Mock Data and Context Providers

- [x] 2.1 Create local mock JSON datasets in `src/data/` representing events, clubs, speakers, and venue maps.
- [x] 2.2 Implement `RsvpContext` to handle dynamic in-memory booking (updating seat availability, user RSVP status, and adding new events).
- [x] 2.3 Implement `NavModeContext` to coordinate simulation states for dual-phase navigation (outdoor coordinates/status and active indoor waypoint step).
- [x] 2.4 Implement a role toggle Context to switch the visual interface layout between Student and Admin views.

## 3. UI Primitives and Layout Shell

- [x] 3.1 Create reusable UI primitives: `Button` (square, solid black borders, offset neobrutalist shadow), `Badge` (pastel colored pill tags), `Card` (thick borders, offset shadow, shifts on hover/click), and `Marquee` (looping horizontal text ticker).
- [x] 3.2 Build layout wrapper components: `NavBar` containing page navigation, role toggle, and brand logo; `Footer` featuring newsletter block and giant logo wordmark; and `PageShell` for page-level transitions.

## 4. Student Flow Pages

- [x] 4.1 Implement `Home` page featuring a neobrutalist hero section (giant bold Epilogue H1, mustard accent CTA button with offset shadow, dot-matrix pattern background, and feature cards), the Discover-RSVP-Navigate feature trio, and event lists.
- [x] 4.2 Implement `EventDiscovery` page with filter bar (square bordered tabs for Today/This Week/Faculty, category filter) and listing cards with neobrutalist borders and shadows.
- [x] 4.3 Implement `EventDetail` page showcasing the event header, speaker/organizer cards, schedule timeline, animated seat meter, and RSVP action button.
- [x] 4.4 Implement `RsvpConfirmation` page featuring ticket card visualization using neobrutalist ticket styling (dashed borders, solid shadows, checklist) and waitlist banner.
- [x] 4.5 Implement `Navigate` page outdoor phase with a simulated Leaflet/custom map placeholder showing walking progress and "Simulate Arrival" CTA.
- [x] 4.6 Implement `Navigate` page indoor phase rendering an inline SVG floor plan and a step-by-step waypoint checklist.
- [x] 4.7 Implement `ClubDirectory` displaying the logo grid of organizations and `ClubProfile` highlighting club description, member cards, and hosted events.

## 5. Admin Flow Pages

- [x] 5.1 Implement `AdminDashboard` listing events along with their live RSVP and waitlist counts.
- [x] 5.2 Implement `AdminEventForm` allowing creation of a new event, appending it to the local mock state on submit.
- [x] 5.3 Implement `AdminVenueUpload` screen for mock SVG upload and waypoint instruction list editing.

## 6. Verification and Polish

- [x] 6.1 Apply Framer Motion animations for page-level slide/fades, scroll-reveals, and micro-interactions on hover.
- [x] 6.2 Test all page flows and check responsiveness across desktop, tablet, and mobile layouts.
