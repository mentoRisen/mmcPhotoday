---
date: 2026-07-02
type: feat
origin: docs/brainstorms/2026-07-02-photoday-hub-requirements.md
execution: code
---

# feat: Photoday Hub — Next.js Skeleton and Homepage

## Summary

Scaffold a greenfield Next.js (App Router, TypeScript) application for Mini Movie Con photoday at `photoday.minimoviecon.sk`, wired to the existing MySQL 8 via Drizzle ORM. V1 delivers a deployable skeleton: shared layout, a branded homepage, placeholder routes for future forms/lists/notifications, a DB health check, and deployment docs (nginx + PM2). Booking, auth, and real notifications are out of scope.

---

## Problem Frame

Mini Movie Con photoday coordinates multiple photographers, sites, cosplayers, and timeslots with a one-session-per-slot constraint. There is no system yet. Before building self-service booking, the team needs a proven foundation: chosen stack running on the VPS, a public homepage, and clear places for future features to live. This plan builds that foundation only (see origin: `docs/brainstorms/2026-07-02-photoday-hub-requirements.md`).

---

## Requirements

**Platform and stack**

- R1. The app runs as a Next.js project (App Router) with React + TypeScript for all UI.
- R2. The app connects to MySQL via environment-configured credentials, using Drizzle ORM over the `mysql2` driver.
- R3. The app is deployable at `photoday.minimoviecon.sk`, reverse-proxied through nginx to the Node process.

**V1 deliverables**

- R4. A branded homepage explains photoday at Mini Movie Con and serves as the public entry point.
- R5. A project skeleton provides shared layout, navigation, and placeholder routes for future forms, lists, and notifications — stubs only, no business logic.
- R6. An env template and README allow a developer to run locally and deploy to the VPS.

---

## Key Technical Decisions

- **Next.js App Router + TypeScript**: Current default Next.js paradigm; server components plus API routes cover both UI and future backend in one codebase (R1).
- **Drizzle ORM + `mysql2` pool with a dev singleton**: Drizzle is lightweight and type-safe. A `globalThis` singleton for the connection pool prevents connection exhaustion during dev hot-reload — a well-documented pitfall with Drizzle + mysql2 (R2).
- **`output: "standalone"` + PM2 for production**: Standalone build yields a self-contained `server.js`; PM2 runs it under nginx. Simpler than Docker on a VPS that already runs Node and nginx (R3).
- **`drizzle-kit generate` + `migrate` for schema**: Migration files give an auditable history; avoid `push` in production. V1 ships only a trivial health/probe usage, but the workflow is set up for later schema growth.
- **Slovak-first homepage copy**: Convention is Slovak (`.sk` domain). Bilingual support deferred; no i18n framework in v1.

---

## Output Structure

```text
mmcPhotoday/
├── .env.example
├── .gitignore
├── README.md
├── next.config.ts
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── ecosystem.config.js          # PM2 process config
├── deploy/
│   └── nginx.conf.example       # reverse-proxy site config
├── drizzle/                     # generated migrations (dir + .gitkeep)
└── src/
    ├── app/
    │   ├── layout.tsx           # root layout + shared nav/footer
    │   ├── page.tsx             # homepage
    │   ├── globals.css
    │   ├── bookings/page.tsx    # placeholder (forms)
    │   ├── sessions/page.tsx    # placeholder (lists)
    │   ├── notifications/page.tsx  # placeholder
    │   └── api/health/route.ts  # DB health check
    ├── components/
    │   └── SiteNav.tsx
    └── db/
        ├── index.ts             # Drizzle client singleton
        └── schema.ts            # initial (minimal) schema
```

The tree is a scope declaration; the per-unit `Files:` sections are authoritative.

---

## Implementation Units

### U1. Scaffold Next.js project with TypeScript and tooling

**Goal:** Create a runnable Next.js App Router project with TypeScript, ESLint, and the standalone build config.

**Requirements:** R1

**Dependencies:** none

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `eslint.config.mjs` (or equivalent Next lint config)

**Approach:** Use `create-next-app` non-interactively (App Router, TypeScript, ESLint, no Tailwind unless it comes as default — plain CSS is fine for v1) targeting the current directory. Set `output: "standalone"` in `next.config.ts`. Confirm `npm run dev` and `npm run build` succeed. Root `layout.tsx` and `page.tsx` will be replaced/expanded in later units; this unit just establishes a green baseline.

**Patterns to follow:** Standard `create-next-app` output conventions.

**Test scenarios:** `Test expectation: none -- scaffolding unit; verified by successful build/dev boot, not automated tests.`

**Verification:** `npm install` succeeds; `npm run build` completes with standalone output; `npm run dev` serves the default page locally.

---

### U2. Wire Drizzle ORM + MySQL with a dev-safe connection singleton

**Goal:** Add Drizzle + mysql2, a singleton pool, a minimal schema, drizzle-kit config, and env plumbing.

**Requirements:** R2

**Dependencies:** U1

**Files:**
- Create: `src/db/index.ts`, `src/db/schema.ts`, `drizzle.config.ts`, `.env.example`, `drizzle/.gitkeep`
- Modify: `package.json` (add `db:generate`, `db:migrate`, `db:studio` scripts and deps)

**Approach:** Install `drizzle-orm mysql2` and `-D drizzle-kit`. In `src/db/index.ts`, create a `mysql.createPool` from `DATABASE_URL` and export a Drizzle instance held on `globalThis` in non-production to survive HMR. `schema.ts` starts minimal (e.g., a small `app_health` or a placeholder table) so migrations have something to generate; real domain tables (sites, timeslots, photographers, cosplayers, sessions) are deferred. `drizzle.config.ts` uses `dialect: "mysql"` and reads `DATABASE_URL`. `.env.example` documents `DATABASE_URL` and `PORT`.

**Patterns to follow:** Drizzle + mysql2 singleton pattern (research: mysql2 HMR connection-exhaustion issue).

**Test scenarios:** `Test expectation: none here -- DB behavior is verified via the health route in U3.`

**Verification:** `npm run build` still passes; `drizzle-kit` CLI is invocable (`npx drizzle-kit --help`); importing `db` does not throw at module load.

---

### U3. Add DB health check API route

**Goal:** Expose `GET /api/health` that runs a trivial query and reports DB connectivity.

**Requirements:** R2, R6

**Dependencies:** U2

**Files:**
- Create: `src/app/api/health/route.ts`, `src/app/api/health/route.test.ts` (or colocated test per chosen runner)

**Approach:** Route handler runs `SELECT 1` through the Drizzle/mysql2 pool. Return `{ status: "ok", db: "up" }` (HTTP 200) on success and `{ status: "error", db: "down" }` (HTTP 503) on failure. Force Node runtime (`export const runtime = "nodejs"`) since mysql2 needs Node APIs. Keep it dependency-light.

**Patterns to follow:** Next.js App Router route handler conventions.

**Test scenarios:**
- Happy path: with a reachable DB (or mocked pool returning a row), the handler returns 200 and `db: "up"`.
- Error path: when the query throws (mocked rejection), the handler returns 503 and `db: "down"` without leaking the raw error to the client.
- `Covers R2` (connectivity is provable via this route).

**Verification:** Unit test passes with a mocked db module; manual `curl /api/health` returns 200 when MySQL is reachable.

---

### U4. Shared layout, navigation, and placeholder routes

**Goal:** Establish the app shell (nav + footer) and stub pages for future forms, lists, and notifications.

**Requirements:** R5

**Dependencies:** U1

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/globals.css`
- Create: `src/components/SiteNav.tsx`, `src/app/bookings/page.tsx`, `src/app/sessions/page.tsx`, `src/app/notifications/page.tsx`

**Approach:** Root layout renders `SiteNav` (links: Domov/home, Rezervácie/bookings, Termíny/sessions, Notifikácie) and a simple footer, with shared metadata (title, description, lang="sk"). Each placeholder page renders a heading and a short "coming soon" note — no forms or data. Keep styling minimal and responsive via `globals.css`.

**Patterns to follow:** Next.js metadata API; App Router nested route file convention.

**Test scenarios:**
- Smoke: each placeholder route renders its heading (component render test or route smoke test).
- `Test note:` layout/nav is largely presentational; one render assertion per placeholder page is sufficient.

**Verification:** `npm run build` passes; navigating to `/bookings`, `/sessions`, `/notifications` renders the stub pages; nav links resolve.

---

### U5. Branded homepage

**Goal:** Replace the default homepage with branded photoday content and entry points into the placeholder areas.

**Requirements:** R4

**Dependencies:** U4

**Files:**
- Modify: `src/app/page.tsx`, `src/app/globals.css`

**Approach:** Homepage presents a hero (event name, tagline, what photoday is), a short explanation of the one-session-per-slot idea in plain Slovak, and call-to-action links to the placeholder areas (clearly marked as upcoming). Responsive, accessible headings, no booking logic.

**Patterns to follow:** Component and styling conventions established in U4.

**Test scenarios:**
- Smoke: homepage renders the event title and at least one CTA link to a placeholder route.
- `Test expectation: mostly presentational -- one render assertion for title + CTA is sufficient.`

**Verification:** `npm run build` passes; homepage renders branded content at `/` with working links; layout holds at mobile and desktop widths.

---

### U6. Deployment and setup documentation

**Goal:** Document local run and VPS deploy (nginx + PM2) with example configs.

**Requirements:** R3, R6

**Dependencies:** U1, U2

**Files:**
- Create: `README.md`, `ecosystem.config.js`, `deploy/nginx.conf.example`

**Approach:** README covers prerequisites (Node 24, MySQL 8), env setup from `.env.example`, `npm run dev`, build, and the standalone deploy flow. `ecosystem.config.js` runs `.next/standalone/server.js` with `HOSTNAME=0.0.0.0` and a configurable `PORT`. `deploy/nginx.conf.example` is a `server` block for `photoday.minimoviecon.sk` proxying to `127.0.0.1:<port>` with a dedicated `/_next/static` cache location and the standard proxy headers. Note that standalone builds require copying `public/` and `.next/static` next to `server.js`.

**Patterns to follow:** Next.js standalone + PM2 + nginx deploy pattern (research).

**Test scenarios:** `Test expectation: none -- documentation and config files, no runtime behavior in-app.`

**Verification:** `nginx -t` accepts the example config (with a real path); README steps produce a running local app; PM2 config references the correct standalone entry path.

---

## Scope Boundaries

**In scope (v1)**

- Next.js scaffold, MySQL/Drizzle wiring, health check, shared layout + placeholders, homepage, deploy docs.

**Deferred for later**

- Organizer workflow to publish sites/timeslots/photographer availability.
- Cosplayer self-booking flow and one-session-per-slot conflict enforcement.
- Authentication and role-based access.
- Real notifications (email/push/in-app).
- Full domain schema (sites, timeslots, photographers, cosplayers, sessions).
- Bilingual/i18n support.

**Outside this product's identity**

- General convention ticketing/registration.
- Photo delivery, galleries, or payment processing.

---

## Open Questions

**Deferred to implementation**

- Whether `create-next-app` default styling (Tailwind vs plain CSS) is used — either is acceptable; plan assumes plain CSS but implementer may keep the tool default.
- Test runner choice (Next.js default / Vitest / Jest) — pick what integrates cleanest with the scaffold; keep the health-route and page smoke tests runnable via `npm test`.

**Resolve before full scheduling (not blocking v1)**

- Booking dimension model (cosplayer picks site + time + photographer is current intent).
- Production process manager finalization (plan assumes PM2).

---

## Sources & Research

- Drizzle + mysql2 singleton pool to avoid dev HMR connection exhaustion (drizzle-orm issue #1988; PkgPulse Drizzle/Next.js 2026 guide).
- Next.js `output: "standalone"` + PM2 + nginx reverse proxy self-hosting pattern (ServerCompass, LumaDock deploy guides, 2026).
- VPS environment verified: Node v24.14.1, MySQL 8.0.45, nginx 1.24.0.
