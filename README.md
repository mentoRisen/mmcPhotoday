# MMC Photoday

Photo-session hub for **Mini Movie Con** photoday, deployed at
`photoday.minimoviecon.sk`. It coordinates photographers, photo sites,
cosplayers, and timeslots so that only one photographer–cosplayer session
happens per site per timeslot.

This repository is the **v1 skeleton**: a branded homepage plus placeholder
routes for the scheduling features that come next. Booking, authentication,
and notifications are not built yet — see
`docs/architecture/app-workflow.md` for actors, domain models, and booking
flows; `docs/brainstorms/2026-07-02-photoday-hub-requirements.md` and
`docs/plans/2026-07-02-001-feat-photoday-hub-skeleton-plan.md` for v1 scope.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** — UI and server/API in one app
- **MySQL 8** via **Drizzle ORM** (`mysql2` driver)
- **Vitest** for tests
- Production: `output: "standalone"` behind **nginx**, run by **PM2**

## Prerequisites

- Node.js 24+
- MySQL 8 (a database and user for the app)

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# edit .env and set DATABASE_URL

# 3. Create the database schema (generates + applies migrations)
npm run db:generate   # writes SQL into ./drizzle from src/db/schema.ts
npm run db:migrate    # applies migrations + seeds four static timeslots

# 4. Run the dev server
npm run dev           # http://localhost:3002
```

Useful checks:

- `GET /api/health` returns `{ "status": "ok", "db": "up" }` when MySQL is reachable, or `503` with `db: "down"` otherwise.
- `npm test` runs the test suite.
- `npm run db:studio` opens Drizzle Studio to inspect the database.

### Domain schema

After `npm run db:migrate`, MySQL holds the photoday domain tables:

- `persons` — unified profiles (`photographer`, `cosplayer`, `organizer`)
- `locations` — bookable photoshoot spots
- `timeslots` — four seeded day milestones (gatherup + three shoot slots)
- `bookings` — cosplayer + photographer + location + timeslot (unique per location/timeslot)

Entity relationships and workflows: `docs/architecture/app-workflow.md`. Booking creation logic: `src/db/bookings.ts` (`createBooking`).

### Catalog import

Organizers load photographer and location catalog data from flat folders before booking opens. This is separate from `db:migrate` — run it when catalog JSON or images change.

**Folder layout**

```text
import/photographers/   one *.json per photographer + co-located JPEG/PNG files
import/locations/       one *.json per location + co-located JPEG/PNG files
```

Copy `import/photographers/example-photographer.json` and `import/locations/example-location.json` as templates. Image filenames must be **unique within each folder** across all JSON files (e.g. two photographers cannot both reference `hero.jpg`).

**Import command**

```bash
# Ensure DATABASE_URL is set (see .env.example)
# Set CATALOG_BASE_URL to the public site URL (defaults to http://localhost:3002)
npm run import:catalog
```

The CLI copies referenced images to `public/catalog/{photographers|locations}/{slug}/`, upserts `persons` (type `photographer`) by email and `locations` by name, and prints per-file results. Re-running is safe — existing records are updated. Operator-added JSON and images are gitignored; only `example-*` templates are tracked.

On production deploy, `public/catalog/` is included when you copy `public/` into the standalone build (see deploy steps below).

## Environment variables

| Variable            | Description                                                        |
| ------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`      | MySQL connection string (`mysql://…`)                              |
| `PORT`              | Port the server listens on (default `3002`)                        |
| `CATALOG_BASE_URL`  | Public base URL for gallery images written by `import:catalog`     |

Never commit `.env`; only `.env.example` is tracked.

## Production deploy (VPS: nginx + PM2)

```bash
# On the server, after pulling the repo and setting up .env:
npm ci
npm run build

# Standalone output does NOT include public/ or .next/static — copy them in:
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

# Start under PM2 (see ecosystem.config.js; set DATABASE_URL in the env there
# or export it before starting):
pm2 start ecosystem.config.js
pm2 save            # persist across reboots
pm2 startup         # follow the printed instruction once
```

Then put nginx in front of it:

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/photoday.minimoviecon.sk
# edit server_name / upstream port if needed
sudo ln -s /etc/nginx/sites-available/photoday.minimoviecon.sk /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
# Add TLS: sudo certbot --nginx -d photoday.minimoviecon.sk
```

Run database migrations on the server as part of each deploy:

```bash
npm run db:migrate
```

## Project structure

```text
src/
  app/
    layout.tsx            # shared shell (nav + footer)
    page.tsx              # homepage
    bookings/             # placeholder — future booking forms
    sessions/             # placeholder — future session lists
    notifications/        # placeholder — future notifications
    api/health/route.ts   # DB connectivity check
  components/SiteNav.tsx
  db/
    index.ts              # Drizzle client (dev-safe pool singleton)
    schema.ts             # domain tables (persons, locations, timeslots, bookings)
    catalog-import.ts     # upsert helpers for catalog import CLI
import/
  photographers/          # organizer JSON + images (example templates committed)
  locations/
scripts/
  import-catalog.ts       # npm run import:catalog
deploy/nginx.conf.example
ecosystem.config.js       # PM2 config
drizzle.config.ts
```
