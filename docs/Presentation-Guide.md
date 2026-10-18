# EventTrail: Comprehensive Project Presentation Guide

Good luck with your presentation tomorrow! This document provides a complete breakdown of the EventTrail platform, structured to help you present the problem, the solution, the architecture, and the current state of the project.

---

## 1. The Problem & Vision
**The Problem:** 
College campuses are busy, and keeping track of events, workshops, club meetings, and hackathons is chaotic. Students miss out on opportunities, and administrators struggle with fragmented tools to track attendance, manage waitlists, and guide students to the right venues.

**The Solution (EventTrail):** 
A unified, modern, serverless platform designed specifically for campus life. It features a seamless dual-portal system:
*   **For Students:** A beautifully designed interface to discover events, join clubs, secure RSVPs, and navigate to venues using interactive maps.
*   **For Admins/Organizers:** A powerful dashboard to create events, monitor live RSVPs, manage waitlists, and extract roster details in real-time.

---

## 2. Key Features (What it does)

### 🧑‍🎓 Student Experience
*   **Authentication:** Secure sign-up and login via AWS Cognito.
*   **Event Discovery:** Browse upcoming events, filter by categories, and view detailed event pages.
*   **Transactional RSVPs:** Students can claim a seat with one click. If the event is full, they are seamlessly placed on a Waitlist.
*   **Campus Maps Integration:** Students can view event locations dynamically.

### 🛡️ Admin/Organizer Experience
*   **Admin Dashboard:** High-level metrics on total registrations and waitlist queues.
*   **Event Management:** Full CRUD (Create, Read, Update, Delete) capabilities for campus events.
*   **Live Roster Management:** A dedicated view to see exactly who is attending (Name, auto-generated Student ID, Email) and who is waitlisted, pulled live from the database.
*   **Venue & Media Uploads:** Direct-to-S3 media uploads for event flyers and venue maps.

---

## 3. Tech Stack & Architecture (How it works)

The project leverages a **Modern Full-Stack Serverless Architecture**, ensuring it is highly scalable, cost-effective, and fast.

### Frontend (Client-Side)
*   **Framework:** React (built with Vite for extreme speed).
*   **Styling:** Tailwind CSS, featuring a custom "neo-brutalist" design language (sharp borders, pastel colors, high contrast) that feels premium and engaging.
*   **State Management:** React Context API & Zustand.
*   **Mapping:** Leaflet & Mapbox GL for interactive campus navigation.
*   **Hosting:** Fully deployed and hosted on **GitHub Pages**.

### Backend (AWS Serverless Infrastructure)
The entire backend is defined using **Infrastructure as Code (IaC)** via the **AWS Cloud Development Kit (CDK)** in TypeScript. 

*   **API Gateway (HTTP APIs):** Acts as the front door, routing all frontend requests to the appropriate Lambda functions.
*   **AWS Lambda (Node.js):** Houses the business logic (e.g., `createRsvp`, `listEventRsvps`, `createEvent`). Since it's serverless, it scales automatically to zero when unused, and scales up instantly during high traffic (like a popular event drop).
*   **Amazon DynamoDB:** A NoSQL database designed for single-digit millisecond latency. 
    *   *Design:* We use optimized tables (`Events`, `RSVPs`, `Users`, `Clubs`) with Partition Keys and Global Secondary Indexes (GSIs).
    *   *ACID Transactions:* When a student RSVPs, DynamoDB Transactions are used to securely decrement the `seatsAvailable` count and create the RSVP record simultaneously, preventing double-booking race conditions.
*   **Amazon Cognito:** Manages User Pools, handles secure JWT token generation, and enforces Role-Based Access Control (RBAC) so students cannot access admin endpoints.
*   **Amazon S3 & CloudFront:** Handles media storage (flyers, avatars). The backend generates pre-signed URLs so the React app can upload files directly to S3 without bottlenecking the Lambda functions.

---

## 4. Current Stage of the Project (Where we are)

**The project is fully functional and live!**
*   **Infrastructure:** All 7 DynamoDB tables, Lambda functions, API Gateway routes, and Cognito User Pools are successfully deployed to the `ap-south-1` (Mumbai) AWS region.
*   **Frontend Deployment:** The React UI is bundled and published live via GitHub Pages. It successfully communicates with the live AWS backend.
*   **Data Flow:** The end-to-end data flow is complete. Admins can create events, and students can securely sign in, RSVP, and consume database seats. The Roster dashboard fetches this live data instantly.
*   **Security:** API routes are heavily protected. Only requests with valid Cognito JWTs can modify data, and administrative actions are strictly cordoned off.

---

## 5. Talking Points for Your Presentation

When presenting, focus on these "Wow Factors":
1.  **The Design:** Emphasize the bold, modern UI. It's not a standard, boring dashboard. It’s designed to keep student engagement high.
2.  **Concurrency Handling (The RSVP System):** Explain the "Race Condition" problem (e.g., 50 students clicking RSVP at the exact same second for 1 remaining seat). Tell them how you solved this using **DynamoDB Transactions (TransactWriteItems)** to guarantee only 1 person gets the seat, gracefully failing the others into a Waitlist queue.
3.  **Serverless Cost Efficiency:** Mention that because the entire backend relies on API Gateway, Lambda, and DynamoDB (Pay-Per-Request), the platform costs practically $0.00 to run when no one is using it, but can handle massive spikes during mid-terms or campus festivals.
4.  **Infrastructure as Code (CDK):** Highlight that the entire AWS infrastructure isn't just manually clicked-together in the console. It is written in TypeScript using AWS CDK, meaning the entire cloud architecture can be torn down and rebuilt in minutes.

---

*End of Guide*
