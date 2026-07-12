# Concepts

Shared domain vocabulary for this project — entities, named processes, and status concepts with project-specific meaning. Seeded with core domain vocabulary, then accretes as ce-compound and ce-compound-refresh process learnings; direct edits are fine. Glossary only, not a spec or catch-all.

## Catalog Domain

### Catalog Import
The end-to-end process that ingests photographer and location records from local source files, validates structure and assets, and persists normalized records with stable gallery URLs.

### Photographer Catalog Entry
A catalog entity representing a photographer profile plus its associated portfolio media set as imported from file-based source material.

### Location Catalog Entry
A catalog entity representing a shoot location profile plus its associated preview media set as imported from file-based source material.

## Scheduling Domain

### Photoshoot Application
A cosplayer's request for a session at a specific location, bookable timeslot, and photographer. Submissions land as pending bookings until an organizer or photographer approves them in a future review flow; pending applications do not hold the location+timeslot pair.

### Confirm-only slot hold
Availability rule where only confirmed bookings block a location+timeslot pair. Multiple pending photoshoot applications may target the same pair until one is confirmed.

### Confirmed Session Schedule
The public `/sessions` (Termíny) timetable showing all confirmed photoshoot applications in a location × timeslot matrix. Each occupied cell displays cosplayer and photographer names; empty cells show `—`. Pending applications do not appear.
