# WearShare

WearShare is an AI-powered clothing-sharing social media platform designed for close-knit college communities. Starting at the University of Florida, it helps roommates, dorm friends, sororities, and close friend groups discover each other's wardrobes, request clothing items for specific dates, and coordinate borrowing in one place.

Instead of buying a whole new outfit for one event, find it in a friend's closet!

> **Our mission:** Make borrowing as convenient as online shopping, help students save money, strengthen real-life connections, and keep clothing in use for longer.

---

## Contents
 
- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [Research and Validation](#research-and-validation)
- [Features](#features)
- [The User Journey](#the-user-journey)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Core API Areas](#core-api-areas)
- [Privacy, Trust, and Safety](#privacy-trust-and-safety)
- [Hackathon Demo](#hackathon-demo)
- [Testing Checklist](#testing-checklist)
- [Impact Measurement](#impact-measurement)
- [Roadmap](#roadmap)
- [Team](#team)

## The Problem

Borrowing clothes from friends is already familiar, but the process is scattered across various direct messages and group chats. It can be difficult to find who owns a particular item, compare options, check availability, agree on dates, and remember to return what was borrowed. Buying something new can feel more convenient, even when a friend nearby already owns a similar item.

This contributes to unnecessary purchases and leaves wearable clothing unused, contributing to the growing issue of textile waste across the world.

In fact, The United Nations Environment Programme reports that approximately **92 million tonnes of textile waste** are generated globally each year. It also reports that clothing production doubled between 2000 and 2015 while the duration of garment use decreased by 36%.

**Source:** [United Nations Environment Programme — Unsustainable Fashion and Textiles](https://www.unep.org/en/news-and-stories/press-release/unsustainable-fashion-and-textiles-focus-international-day-zero)

## Our Solution

WearShare makes clothing borrowing organized, searchable, and social. Users create digital closets, share selected items with trusted friends, discover clothing through filters, request items for specific dates, and coordinate exchanges through direct messages.

WearShare is different from a second-hand online marketplace as the focus is on **temporary borrowing between people who already know or trust each other**, rather than buying and selling.

### Why WearShare?

- **Convenience:** Search multiple friends' closets in one place instead of messaging friend after friend to see who has what you need.
- **Affordability:** Avoid the expense of purchasing an outfit you'll only wear for a specific event.
- **Trust:** Clothing sourced from approved friends and private groups.
- **Reuse:** Help people get longer use out of clothing that already exists.
- **Social connection:** Turn the familiar activity of borrowing into an easier way to connect with friends in real life.

## Research and Validation

Our initial Google Form received **50 responses**, and **99% of respondents said they would find the concept useful**. This is an encouraging early interest, however, not proof of long-term adoption and use. The next step is to measure whether people can effectively and easily upload items, borrow successfully, and return to use WearShare.

Our research also informs the product's design:

- **Textile waste:** UNEP estimates that 92 million tonnes of textile waste are generated globally each year.
- **Borrowing behavior:** Research on borrowing and sharing suggests that many people already turn to friends and family to borrow items. WearShare aims to reduce the effort it takes to coordinate such.
- **Trust and hygiene:** Concerns about cleanliness and the uncertainty of use products can make people reluctant to buy second-hand or use circular fashion services. WearShare focuses on ensuring the user is within trusted communities and lets borrowers and owners discuss washing expectations.
- **Enjoyment and discovery:** A social, searchable closet can make finding an outfit feel more engaging, almost like a treasure hunt, rather than a chore.
- **Student budgets:** College students often need different outfits for formals, parties, interviews, game days, and themed events while managing limited funds.

### Research sources

- [UNEP — Unsustainable Fashion and Textiles](https://www.unep.org/en/news-and-stories/press-release/unsustainable-fashion-and-textiles-focus-international-day-zero)
- [Research on borrowing and sharing behavior](https://www.tandfonline.com/doi/full/10.1080/23251042.2025.2510410)
- [Research on consumer attitudes toward circular fashion services](https://www.sciencedirect.com/science/article/pii/S0969698921000230)
- [Student Financial Wellness Survey, Fall 2025 results](https://eric.ed.gov/?id=ED681192)

We distinguish published research from our own survey and from future impact goals. Survey results reflect our respondents and should not be treated as representative of all college students.

## Features

### 1. Profiles and authentication

- Create a profile with a display name, username, and profile photo.
- Sign in securely using Auth0.
- Search for users and send or accept to friend requests.
- View friends' closets when permission is granted.

### 2. AI-assisted digital closets

- Upload a photo for each clothing item.
- Use the **Groq API** to generate a short, editable clothing description and other relevant attributes.
- Add or edit item type, brand, size, color, and style.
- Display the uploaded product photo in the owner's closet and in search results.
- Edit or delete listings.
- Choose which dates an item is available to lend.

AI output is a suggestion, not verified information. A photo may not reveal a garment's exact brand or size, so users should review generated details and enter accurate information themselves.

### 3. Friends and private groups

- Search for friends and manage friend requests.
- Create groups for roommates, dorm communities, sororities, and close friend groups.
- Invite people through a shareable group invitation link.
- Let group owners approve membership.
- Choose which items to share with each group, with a **Share All** option.
- Update sharing preferences or leave groups.
- Keep closets private by default.

### 4. Search and filters

Search clothing shared by friends and groups the user is authorized to access. Useful filters include:

- Item type
- Brand
- Size
- Color
- Style
- Availability

### 5. Borrowing requests and availability calendar

- Select a date range on an availability calendar.
- Require requests at least **24 hours before the requested start time**.
- Let the owner approve or decline each request.
- Separate sent, received, pending, approved, and declined requests.
- Show approved dates as unavailable to other borrowers.
- Prevent overlapping approved reservations for the same item.
- Release reserved dates when an approved booking is cancelled.
- Track agreed return dates and borrowing status.

Pending requests do not reserve an item. When one request is approved, overlapping pending requests must be rechecked and declined or asked to choose new dates.

### 6. Direct messages

Messaging is separate from the requests page so users can coordinate the real-life exchange without losing track of reservation status.

Users can discuss:

- Pickup and drop-off
- Return dates
- Washing preferences
- Other practical details of the exchange

### 7. Returns, reminders, and notifications

The intended experience includes clear item statuses such as **available, requested, reserved, and overdue**. Notifications can alert owners when someone requests an item, and return reminders can help borrowers remember agreed dates.

Reminder and notification delivery depends on the features implemented in the current build. The app can help users communicate and keep a record, but it cannot guarantee that an item is returned undamaged or on time.

### 8. Washing preferences and accountability

Users can agree whether the borrower should wash an item before returning it or whether the owner prefers to wash it. Clear expectations, borrowing dates, messages, and status history can support accountability without promising that disputes can always be prevented.

## The User Journey

1. **Join:** A student signs in and creates a profile.
2. **Build a closet:** They upload an item photo and use AI to draft its description.
3. **Review:** They edit the item type, brand, size, color, style, and lending dates.
4. **Share:** They choose friends or groups who can view the listing.
5. **Discover:** A friend searches authorized closets and filters the results.
6. **Request:** The friend selects dates and submits a borrowing request.
7. **Approve:** The owner accepts or declines. Approved dates become unavailable to other borrowers.
8. **Coordinate:** Both people use DMs to agree on pickup, washing, and return.
9. **Return:** The borrowing status can be updated and the item becomes available again according to its schedule.

## Technology Stack

| Layer | Technology | Role |
|---|---|---|
| Product and UI design | Figma | Plan and design the user experience |
| Frontend | HTML, CSS, JavaScript | Build the interactive web application |
| Backend | Python, FastAPI | Implement server-side logic and REST endpoints |
| AI | Groq API | Generate AI-assisted clothing descriptions using the configured model |
| Authentication | Auth0 | Sign-in and identity management |
| Database | Tiger Data / Tiger Cloud PostgreSQL | Store relational application data |
| Hosting | Vultr | Host the application backend or other deployed services |
| API communication | HTTP / REST | Connect frontend and backend |
| Version control | Git and GitHub | Track and collaborate on code |

The exact deployment configuration, model name, image storage provider, and environment variable names should match the current repository. Do not put API secrets in frontend code.

## Architecture

```text
                   WearShare Web App
                  React + HTML/CSS/JS
                           |
                           | REST requests
                           v
                    FastAPI Backend
                    (Python endpoints)
                     /      |       \
                    /       |        \
                   v        v         v
                Auth0     Groq API   Tiger Data
             authentication AI text  PostgreSQL
                              \       /
                               \     /
                         Clothing listings,
                         sharing, requests,
                         reservations, DMs

                   Vultr: application hosting
```

- **React frontend:** Renders profiles, closets, search, groups, calendars, requests, and messages.
- **FastAPI backend:** Exposes endpoints, validates input, checks permissions, and enforces borrowing rules.
- **Groq API:** Supplies AI-generated descriptions through a backend integration. The selected model must support the inputs the application sends.
- **Auth0:** Verifies user identity. The backend must still authorize access to each private resource.
- **Tiger Data:** Stores structured records such as users, items, friendships, group membership, requests, and messages.
- **Vultr:** Provides cloud infrastructure for deploying the application services.

Images may be stored in an object-storage service rather than directly in PostgreSQL. If image storage is configured separately, the database should keep the image reference and metadata while access controls protect the actual file.

## Getting Started

These instructions are a starting point. Use the actual file names, scripts, and environment variable names in your repository if they differ.

### Prerequisites

- Python 3.11+
- Node.js and npm
- Git
- A Groq API key
- Auth0 application credentials for production-style sign-in
- Tiger Data connection details for the hosted PostgreSQL database
- A Vultr account if deploying to Vultr

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd WearShare
```

Replace the placeholder with your actual GitHub repository URL. If the repository is already on your computer, open its root folder instead.

### 2. Configure the backend

If your repository has a `backend` directory:

```bash
cd backend
python -m venv .venv
```

Activate the environment.

**macOS/Linux**
```bash
source .venv/bin/activate
```

**Windows Command Prompt**
```bat
.venv\Scripts\activate
```

**Windows PowerShell**
```powershell
.venv\Scripts\Activate.ps1
```

Install the project's dependencies using its dependency file, if present:

```bash
pip install -r requirements.txt
```

Create a local environment file from the example if the repository provides one:

```bash
cp .env.example .env
```

On Windows Command Prompt, use `copy .env.example .env`. If there is no `.env.example`, create `.env` using the variables required by the application.

### 3. Add service credentials

Example configuration only; the application may use different variable names:

```dotenv
GROQ_API_KEY=your-groq-api-key
AUTH0_DOMAIN=your-auth0-domain
AUTH0_AUDIENCE=your-api-audience
DATABASE_URL=your-tiger-data-postgresql-connection-string
```

Use the exact variable names expected by your code. Obtain the Groq key from [Groq Console](https://console.groq.com/keys), Auth0 values from your Auth0 dashboard, and the database connection string from Tiger Data.

**Never commit `.env` files, API keys, database passwords, access tokens, or private storage credentials to GitHub.**

### 4. Start the backend

Use the entry point in your repository. For a FastAPI application whose module is `app.main`:

```bash
uvicorn app.main:app --reload
```

If your app uses a different module path, adjust the command accordingly. Once the server starts, FastAPI's interactive documentation is usually available at:

- `http://localhost:8000/docs`
- `http://localhost:8000/openapi.json`

### 5. Start the frontend

From the frontend directory, install packages and start the development server using the scripts in `package.json`. For a typical React/Vite project:

```bash
npm install
npm run dev
```

Open the local URL printed by the development server. Configure the frontend's API base URL to point to the local FastAPI server.

### 6. Configure Auth0

1. Create an API in the Auth0 dashboard and note its identifier/audience.
2. Create a Single Page Application and note the domain and client ID.
3. Add your frontend development URL to the allowed callback, logout, and web-origin URLs.
4. Configure the matching frontend and backend settings.
5. Verify that the frontend sends a bearer access token and that FastAPI validates it.

Frontend configuration may include public Auth0 domain, client ID, and audience values. **It must never include the Groq API key or database credentials.**

### 7. Configure Tiger Data

Create or select a PostgreSQL database in Tiger Data/Tiger Cloud, then use its supplied connection string in the backend configuration. Ensure the PostgreSQL driver, schema, migrations, and connection settings are compatible with the project.

For local development, a local database may be supported if the code has been configured for one. Do not assume SQLite fallback exists unless it is implemented in the repository.

### 8. Deploy with Vultr

A typical deployment plan is:

1. Provision a Vultr server or supported hosting environment.
2. Install the required Python runtime and application dependencies.
3. Configure environment variables securely on the server.
4. Run FastAPI behind a production ASGI server and HTTPS reverse proxy.
5. Configure the frontend's production API URL and deploy the built frontend.
6. Restrict database access and configure Auth0 allowed URLs for the production domain.
7. Test sign-in, uploads, item visibility, AI descriptions, and concurrent reservation requests in the deployed environment.

Deployment commands depend on the Vultr product and the repository's hosting setup. Do not expose the development server directly as a production deployment.

## Environment Variables

Variable names below are illustrative. Confirm the exact names used by the code before running the application.

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Backend access to the Groq API |
| `AUTH0_DOMAIN` | Auth0 tenant/domain |
| `AUTH0_AUDIENCE` | Identifier for the protected backend API |
| `DATABASE_URL` | Tiger Data PostgreSQL connection string |
| `VITE_API_URL` | Frontend API base URL, if using Vite |
| `VITE_AUTH0_DOMAIN` | Public Auth0 domain configuration, if using Vite |
| `VITE_AUTH0_CLIENT_ID` | Public Auth0 application client ID, if using Vite |
| `VITE_AUTH0_AUDIENCE` | Public API audience configuration, if using Vite |

Only add variables that your code actually reads. Keep secrets on the backend and use your deployment platform's secure environment configuration for production.

## Core API Areas

FastAPI endpoints should support the following application areas. The exact paths and implementation status are determined by the current code; use the live `/docs` page as the source of truth.

| API area | Responsibilities |
|---|---|
| Authentication and profiles | Current profile, profile updates, user search |
| Friends | Friend requests, approvals, friends list |
| Clothing items | Upload, create, search, view, edit, delete |
| AI descriptions | Validate image input and request a description from Groq |
| Groups | Create/join groups, approve members, manage item sharing |
| Availability | Retrieve lending dates and booked dates |
| Borrowing requests | Create, approve, decline, cancel, record return |
| Conversations | Start conversations, retrieve messages, send messages |
| Bootstrap / notifications | Load screen data and surface relevant activity, if implemented |

## Privacy, Trust, and Safety

WearShare is designed for trusted communities. Privacy must be enforced on the server, not only by hiding buttons in the frontend.

- **Private by default:** Only authorized friends and approved group members can view a listing.
- **Explicit group sharing:** Users choose what to share with each group; a group membership does not automatically mean every item is shared.
- **Membership controls:** Group owners can approve new members.
- **Ownership checks:** Only the owner can edit or delete their listing.
- **Token verification:** Validate Auth0 access tokens on protected backend endpoints.
- **Server-side authorization:** Do not trust a client-submitted user ID as proof of identity or permission.
- **Upload validation:** Restrict supported image types and file sizes; handle invalid uploads safely.
- **Secret management:** Keep Groq and database credentials on the server.
- **Private image access:** Protect uploaded photos with suitable access controls and, where supported, short-lived signed links.
- **Location minimization:** The core experience does not require live tracking. If proximity features are added, prefer optional approximate location and never expose a user's exact address publicly.
- **Reservation integrity:** Check availability when approving requests and use database transactions or constraints to prevent overlapping approved bookings.

### Borrowing rules

1. A borrower must be authorized to view the item.
2. Requested dates must fall within the owner's lending availability.
3. Requests must start at least 24 hours in the future.
4. Pending requests do not reserve dates.
5. Approved bookings for the same item cannot overlap.
6. Approval must recheck availability atomically so simultaneous approvals cannot both reserve the same dates.
7. Canceling an approved booking should release the dates.
8. The owner and borrower should agree on pickup, return, and washing expectations.

## Hackathon Demo

Aim to demonstrate one complete, reliable user journey rather than a long list of disconnected screens.

1. Sign in as **Alex** in one browser window and **Maya** in another.
2. As Alex, upload a clothing photo and generate an AI-assisted description.
3. Review the suggested details, add any missing information, and save the listing.
4. Share the item with a private group such as **Hume Hall**.
5. As Maya, open the group, search or filter the shared items, and choose Alex's listing.
6. Select a date range and submit a borrowing request.
7. As Alex, view the received request and approve it.
8. As Maya, confirm the approved dates are blocked on the availability calendar.
9. Use DMs to agree on pickup and return details.

This demonstrates the central product loop:

**Upload → AI description → Share → Discover → Request → Approve → Coordinate**

Use demo accounts and sample data during judging. Never display API keys, private credentials, or real users' private information.

## Testing Checklist

Before presenting or deploying, verify:

- [ ] The frontend loads and connects to FastAPI.
- [ ] Auth0 sign-in works when configured.
- [ ] Users can create and update their profiles.
- [ ] A clothing photo uploads and appears in the closet and search results.
- [ ] Groq returns an editable description using the configured model.
- [ ] Users can edit and delete their own listings.
- [ ] Group membership and item-sharing permissions are enforced.
- [ ] Unauthorized users cannot view private listings.
- [ ] Lending availability is respected.
- [ ] Requests require at least 24 hours of advance notice.
- [ ] Overlapping approved reservations are prevented, including simultaneous approvals.
- [ ] Request statuses are clear to borrowers and owners.
- [ ] DMs support pickup and return coordination.
- [ ] Secrets are excluded from Git history and frontend bundles.
- [ ] Error states are understandable when an external service is unavailable.

## Impact Measurement

WearShare aims to help clothing stay in use for longer by making borrowing within existing communities easier.

We plan to track:

- Items uploaded
- Active users and sharing groups
- Borrowing requests submitted and approved
- Completed exchanges and repeat borrowing
- Return completion and overdue rates, if implemented
- Users who report that borrowing helped them avoid a purchase

We will separate observed platform activity from self-reported behavior. We will not claim a precise amount of textile waste or emissions avoided without a transparent, defensible calculation method.

## Roadmap

### Phase 1 — Core experience
- Profiles and authentication
- Clothing photo uploads
- Groq-powered editable descriptions
- Digital closets and listing management

### Phase 2 — Trusted discovery
- Friends and friend requests
- Private groups and invitation links
- Group membership approval
- Per-group item sharing and Share All
- Search and filters

### Phase 3 — Reliable borrowing
- Lending availability calendars
- Request, approval, decline, and cancellation flows
- Conflict-free reservations
- Borrowing statuses and return tracking

### Phase 4 — Communication and launch
- Direct messages
- Notifications and return reminders
- Washing preferences
- Mobile experience improvements
- Deployment, monitoring, and testing

### Future possibilities
- Outfit suggestions
- Saved items and collections
- Optional approximate-location discovery
- Borrowing history and reporting
- Expansion to additional university communities

## Team

WearShare was created around a simple idea: your next outfit might already belong to someone you know.

By combining AI-assisted closet creation, trusted groups, searchable listings, and organized borrowing, WearShare aims to make sharing clothes a practical part of student life.

---

**WearShare — Wear more. Buy less. Share with friends.**
