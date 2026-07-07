# Architecture

Durable reference for how MMC Photoday is structured and how the main flows work.

| Document | Purpose |
|----------|---------|
| [app-workflow.md](./app-workflow.md) | Actors, domain models, day schedule, booking rules, and end-to-end workflows |

## Related requirements

- [Photoday hub (product)](../brainstorms/2026-07-02-photoday-hub-requirements.md) — platform, v1 skeleton scope, target product intent
- [Domain models](../brainstorms/2026-07-06-domain-models-requirements.md) — detailed entity fields, constraints, and acceptance examples
- [Skeleton implementation plan](../plans/2026-07-02-001-feat-photoday-hub-skeleton-plan.md) — v1 scaffold that shipped

## Terminology

| Term | Meaning |
|------|---------|
| **Location** | Bookable photoshoot spot (replaces earlier "site" / Slovak *fotostanovištia*) |
| **Person** | Unified profile for photographer, cosplayer, or organizer |
| **Booking** | One confirmed session: cosplayer + photographer + location + shoot timeslot |
| **Gatherup** | 9:00 day-schedule milestone; not bookable |
