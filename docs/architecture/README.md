# Architecture

Durable reference for how MMC Photoday is structured and how the main flows work.

| Document | Purpose |
|----------|---------|
| [app-workflow.md](./app-workflow.md) | Actors, domain models, day schedule, booking rules, and end-to-end workflows |
| [photographer-application-review.md](./photographer-application-review.md) | Photographer `loginHash` access, confirm/revoke applications on `/photographers/[id]` |
| [email.md](./email.md) | Reusable SMTP email component, env config, API, and `test:email` command |

## Related requirements

- [Photoday hub (product)](../brainstorms/2026-07-02-photoday-hub-requirements.md) — platform, v1 skeleton scope, target product intent
- [Domain models](../brainstorms/2026-07-06-domain-models-requirements.md) — detailed entity fields, constraints, and acceptance examples
- [Skeleton implementation plan](../plans/2026-07-02-001-feat-photoday-hub-skeleton-plan.md) — v1 scaffold that shipped

## Terminology

| Term | Meaning |
|------|---------|
| **Location** | Bookable photoshoot spot (replaces earlier "site" / Slovak *fotostanovištia*) |
| **Person** | Unified profile for photographer, cosplayer, or organizer |
| **Booking** | Session record linking cosplayer, photographer, location, and timeslot; `pending` (application) or `confirmed` (slot held) |
| **Application** | A `bookings` row with `status = pending` until a photographer confirms it |
| **loginHash** | Per-photographer secret in `persons.login_hash`; passed as `?loginHash=` to enable confirm/revoke on the detail page |
| **Gatherup** | 9:00 day-schedule milestone; not bookable |
