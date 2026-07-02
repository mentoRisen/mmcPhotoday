---
date: 2026-07-02
topic: photoday-hub
---

# Photoday Hub — Requirements

## Summary

A greenfield web hub for Mini Movie Con photoday at `photoday.minimoviecon.sk`, built as a **Next.js full-stack app** (React UI + server API layer) with **MySQL** on the existing VPS. Cosplayers will eventually self-book a photo site, timeslot, and photographer under a one-session-per-slot constraint. V1 delivers a deployable project skeleton and branded homepage with placeholder structure for forms, lists, and notifications — not live scheduling.

---

## Problem Frame

Mini Movie Con photoday brings together multiple photographers, photo sites, cosplayers, and timeslots. Each site/timeslot can host only one photographer–cosplayer session at a time. Today there is no dedicated system for this convention; organizers and participants need a central place to coordinate bookings instead of ad-hoc spreadsheets or messages.

The first milestone is not the full scheduling product. It is a simple, maintainable foundation: chosen stack, working deploy path, public homepage on the photoday subdomain, and a skeleton the team can grow into self-service booking.

---

## Key Decisions

- **Next.js full-stack** — React handles the GUI; Next.js API routes or server actions handle backend logic in the same project. Keeps deploy and codebase simple on a VPS that already runs Node and nginx.
- **MySQL as the database** — Use the MySQL instance already available on the VPS. Access via an ORM layer (Drizzle recommended at planning time) rather than raw SQL in application code.
- **Cosplayer-driven booking (target behavior)** — The intended end state is cosplayers self-booking by choosing site, timeslot, and a specific photographer. Conflict rule: at most one photographer–cosplayer pair per site per timeslot.
- **V1 is skeleton + homepage only** — Prove infrastructure and app shape before building booking, auth, or notifications.

---

## Actors

- A1. **Cosplayer** — Books a photo session by selecting site, timeslot, and photographer (future; not in v1).
- A2. **Photographer** — Sees assigned or booked sessions for their queue (future; not in v1).
- A3. **Organizer** — Configures sites, timeslots, and which photographer combinations are bookable (future; model deferred).
- A4. **Visitor** — Lands on the public homepage to learn about photoday and find entry points to the app (v1).

---

## Requirements

**Platform and stack**

- R1. The application runs as a Next.js project with React for all user-facing UI.
- R2. The application connects to MySQL for persistent storage; connection is configured via environment variables suitable for VPS deployment.
- R3. The application is intended for deployment at `photoday.minimoviecon.sk`, reverse-proxied through nginx to the Node process.

**V1 deliverables**

- R4. A branded **homepage** explains photoday at Mini Movie Con and serves as the public entry point.
- R5. A **project skeleton** includes app layout, shared navigation or structure, and placeholder routes or pages for future forms, lists, and notification-related UI — stubs only, no business logic.
- R6. Environment and setup documentation (or env template) allow a developer to run the app locally and deploy to the VPS.

**Target product (documented intent, not v1 scope)**

- R7. Cosplayers self-book by choosing photo site, timeslot, and a specific photographer.
- R8. The system enforces at most one photographer–cosplayer session per site per timeslot.
- R9. The product includes forms (booking and related input), list views (sessions, availability, queues), and notifications — to be built after the skeleton.

---

## Key Flows

- F1. **Visitor lands on homepage (v1)**
  - **Trigger:** User opens `photoday.minimoviecon.sk`.
  - **Actors:** A4
  - **Steps:** Homepage loads with convention photoday branding; navigation or links point to placeholder areas for future booking and info pages.
  - **Outcome:** Visitor understands photoday exists and the site is live; no booking occurs in v1.

- F2. **Cosplayer self-books a session (future)**
  - **Trigger:** Cosplayer opens the booking flow.
  - **Actors:** A1, A3 (implicit — organizer must have published bookable options)
  - **Steps:** Cosplayer selects site, timeslot, and photographer from available options; system rejects the request if that site/timeslot is already taken.
  - **Outcome:** One confirmed session; photographers and relevant parties can be notified (notifications deferred).
  - **Covered by:** R7, R8

---

## Scope Boundaries

**In v1**

- Next.js project scaffold with MySQL wiring
- Branded homepage
- Placeholder pages or routes for forms, lists, notifications
- Deploy/run instructions for the VPS stack (Node, nginx, MySQL)

**Deferred for later**

- Organizer workflow for publishing sites, timeslots, and photographer availability
- Cosplayer self-booking flow and conflict enforcement
- Authentication and role-based access (cosplayer, photographer, organizer)
- Real notifications (email, push, or in-app)
- Full implementation of forms and list pages beyond placeholders

**Outside v1 identity**

- General convention ticketing or registration (photoday hub is scheduling only)
- Photo delivery, gallery hosting, or payment processing

---

## Dependencies / Assumptions

- MySQL 8 is available on the target VPS and reachable from the application.
- Node.js is installed on the VPS (v24 observed in environment).
- nginx is available for reverse proxy to the Next.js process.
- The repository starts empty; no legacy code or data migration.
- Team has no strong stack preference; simplicity favors a single Next.js codebase over a split frontend + separate API service.

---

## Success Criteria

- A developer can clone the repo, configure env, connect to MySQL, and run the app locally.
- The homepage is deployable and reachable at `photoday.minimoviecon.sk` (or staging equivalent).
- Placeholder structure makes it obvious where booking forms, session lists, and notification UI will live without implementing them in v1.
- Stack choice is documented so planning does not re-litigate Next.js vs alternatives.

---

## Outstanding Questions

**Deferred to planning**

- How organizers publish the bookable grid (sites × timeslots × photographers).
- Authentication method (convention account, magic link, OAuth, or organizer-managed accounts).
- Notification channels and triggers.
- Slovak vs bilingual UI copy on homepage and future flows.
- Process manager for production (PM2, systemd, or container).

**Resolve before full scheduling (not blocking v1 skeleton)**

- Whether photographers are fixed to sites for a timeslot or cosplayers always pick all three dimensions explicitly (cosplayer picks site + time + photographer is the current intent).
