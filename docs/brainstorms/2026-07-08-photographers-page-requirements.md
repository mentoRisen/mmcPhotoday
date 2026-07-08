---
date: 2026-07-08
topic: photographers-page
---

# Photographers Page — Requirements

## Summary

Add a public `/photographers` page where visitors browse enlisted photographers before booking. The page shows a single scrollable grid of cards — name, description snippet, portfolio cover preview, and social links — without email, detail pages, or booking actions. Photographers appear in enlistment order, with Slovak copy throughout and links from main navigation and the homepage.

---

## Problem Frame

The photoday homepage introduces photographers as a core part of the event, but there is no public surface to actually see who is shooting. Visitors and cosplayers who want to preview styles before booking opens have nowhere to look.

Organizers already load photographer profiles through catalog import (`persons` rows with portfolio URLs and social links). The data exists; only a read-only browse experience is missing. This page closes the homepage gap without pulling booking logic forward.

---

## Key Decisions

- **Browse-only, no booking on this page** — Visitors preview the roster and portfolio style. Choosing a photographer and reserving a slot stays in the future booking flow.
- **Single-page card list, no detail routes** — Each photographer is fully represented on one card. No `/photographers/[id]` pages in this milestone.
- **Cover-hero card layout** — First portfolio image as a prominent cover, with name, clamped description, and a social icon row. Responsive grid: one column on mobile, two on tablet, three on desktop.
- **Enlistment order, not alphabetical** — Cards sort by ascending `persons.id` so first-imported photographers appear first. Re-imported profiles keep their original position.
- **Email stays private** — Required in the database but never shown on public cards. Social links are the contact surface.
- **Slovak UI copy** — Page title, lead text, empty state, and nav label follow the Slovak language used elsewhere in the app.

---

## Actors

- A1. **Visitor** — Browses the photographer roster to learn who is shooting and preview portfolio style before booking opens.
- A2. **Cosplayer** — Same browse behavior as a visitor in this milestone; no account or booking action on this page.

---

## Requirements

**Page and routing**

- R1. The app serves a public page at `/photographers`.
- R2. The page is reachable without authentication.
- R3. Main navigation includes a link to `/photographers` labeled in Slovak (e.g. "Fotografi").
- R4. The homepage links to `/photographers` from the photographers feature area.

**Data**

- R5. The page lists all `persons` records where `type` is `photographer`.
- R6. Photographers are ordered ascending by `id` (enlistment order).
- R7. Each card shows the photographer's `name`.
- R8. Each card shows an optional `description` snippet, clamped to roughly two lines on the card.
- R9. Each card shows a portfolio cover preview using the first URL in `portfolio_urls` when present.
- R10. When `portfolio_urls` is empty or missing, the card shows a styled placeholder instead of a broken image.
- R11. Each card shows social links only for populated fields among `instagram`, `facebook`, `twitter`, and `website`. Empty fields render no icon or link.
- R12. Email is never displayed on this page.

**Layout and responsiveness**

- R13. Cards use a responsive grid: one column on narrow viewports, scaling to multiple columns on wider screens.
- R14. The page is usable on mobile without horizontal scrolling of page content.
- R15. Portfolio cover images preserve aspect ratio and do not overflow card bounds.
- R16. Social link icons or controls have a touch-friendly tap target on mobile.

**Empty and edge states**

- R17. When no photographer records exist, the page shows a friendly Slovak empty state that hints organizers should run catalog import.
- R18. When a photographer has no `description`, the card omits the description area without leaving a broken layout gap.

**Out of scope for page behavior**

- R19. This page does not show booking availability, timeslot occupancy, or session counts.
- R20. This page does not include a call-to-action that starts or deep-links into the booking flow.

---

## Key Flows

- F1. **Visitor browses photographers**
  - **Trigger:** Visitor opens `/photographers` from nav, homepage, or a direct URL.
  - **Actors:** A1, A2
  - **Steps:** App loads all photographer records in enlistment order. Visitor scrolls the card grid, views cover images and descriptions, and optionally opens social links in a new tab.
  - **Outcome:** Visitor has a feel for who is shooting and their visual style.
  - **Covered by:** R1, R5–R12, R13–R16

- F2. **Empty catalog**
  - **Trigger:** No photographer records exist in the database.
  - **Actors:** A1
  - **Steps:** Visitor opens `/photographers` and sees the empty state instead of cards.
  - **Outcome:** Visitor understands the roster is not published yet.
  - **Covered by:** R17

---

## Acceptance Examples

- AE1. **Populated roster**
  - **Covers:** R5–R12, R13
  - **Given:** Three photographer records exist with names, descriptions, portfolio URLs, and mixed social links.
  - **When:** A visitor opens `/photographers`.
  - **Then:** Three cards appear in `id` order. Each card shows name, description snippet, cover image, and only the social icons for links that exist. No email appears.

- AE2. **Missing portfolio**
  - **Covers:** R10, R18
  - **Given:** A photographer has a name and description but an empty `portfolio_urls` array.
  - **When:** A visitor views the page.
  - **Then:** The card shows a placeholder where the cover image would be. Name and description still render.

- AE3. **Empty catalog**
  - **Covers:** R17
  - **Given:** No `persons` rows with `type` photographer exist.
  - **When:** A visitor opens `/photographers`.
  - **Then:** A Slovak empty-state message appears with an organizer-oriented hint. No cards render.

- AE4. **Mobile layout**
  - **Covers:** R13, R14, R16
  - **Given:** At least one photographer exists.
  - **When:** A visitor views the page on a narrow mobile viewport.
  - **Then:** Cards stack in a single column without horizontal page scroll. Social links remain tappable.

---

## Success Criteria

- SC1. A visitor can identify all enlisted photographers and preview at least one portfolio image per photographer (or see a clear placeholder) without leaving `/photographers`.
- SC2. The page matches the existing dark visual language (`globals.css` tokens, card surfaces, accent colors) and reads as part of the same product as the homepage.
- SC3. The page renders correctly on a 375px-wide viewport with no content clipping or overflow.

---

## Scope Boundaries

**In scope**

- `/photographers` route and page UI
- Server-side load of photographer records from the database
- Nav and homepage discovery links
- Slovak copy for page chrome and empty state
- Responsive card grid with portfolio placeholder handling

**Deferred for later**

- Individual photographer detail pages
- Booking CTA or deep-link into photographer selection
- Availability or session-count indicators on cards
- Search, filter, or sort controls beyond enlistment order
- Image lightbox or inline gallery expansion beyond the cover preview
- Locations browse page (`/locations`) — adjacent but separate

**Outside this product's identity**

- Public email display or contact forms on photographer cards
- Photographer self-service profile editing

---

## Dependencies / Assumptions

- Photographer records are populated via catalog import (`npm run import:catalog`) or equivalent upsert before the page has content.
- `persons.portfolio_urls` contains served URLs (absolute or root-relative) produced by the catalog import pipeline.
- Domain schema for `persons` is implemented as defined in `docs/brainstorms/2026-07-06-domain-models-requirements.md`.
- Social link fields store full URLs suitable for external `href` targets.

---

## Outstanding Questions

**Deferred to planning**

- Exact Slovak strings for page title, nav label, and empty-state copy
- Whether social links open in a new tab with `rel="noopener noreferrer"` (recommended default)
- Placeholder visual treatment when no portfolio image exists (icon, initials, or generic camera graphic)

---

## Sources / Research

- Domain model and photographer fields: `docs/brainstorms/2026-07-06-domain-models-requirements.md`
- Schema plan: `docs/plans/2026-07-06-001-feat-domain-models-schema-plan.md`
- Catalog import: `docs/brainstorms/2026-07-07-catalog-import-requirements.md`
- App workflow and actors: `docs/architecture/app-workflow.md`
- Existing UI patterns: `src/app/page.tsx`, `src/app/globals.css`, `src/components/SiteNav.tsx`
- Photographer data layer: `src/db/schema.ts`, `src/db/catalog-import.ts`
- Example import record: `import/photographers/example-photographer.json`
