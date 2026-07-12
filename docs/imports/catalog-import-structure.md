# Catalog Import Folder Structure

This document describes how to add and organize catalog data under `import/`. Use it as a reference when creating photographer or location files for `npm run import:catalog`.

## Directory layout

```
import/
├── photographers/                     ← one JSON + images per photographer
│   ├── example-photographer.json
│   ├── example-portfolio-01.jpg
│   └── example-portfolio-02.jpg
└── locations/                         ← one JSON + images per location
    ├── example-location.json
    ├── example-preview-01.jpg
    └── example-preview-02.jpg
```

**Rules for both folders:**

- One entity = one `*.json` file.
- Gallery images are JPEG or PNG files stored **flat** in the same folder (no subfolders).
- Image filenames must be **unique within the folder** across all JSON files. Two photographers cannot both reference `hero.jpg` in `import/photographers/`.
- Only files listed in a JSON gallery array are imported. Unreferenced images are ignored.

---

## Photographers (`import/photographers/`)

### JSON file naming

Use a descriptive filename, e.g. `anna-kovar.json`. The filename is only for humans; the database upsert key is `email`.

### JSON structure

```json
{
  "name": "Anna Kovář",
  "email": "anna@example.sk",
  "description": "Optional bio shown on the public photographers page.",
  "instagram": "https://instagram.com/handle",
  "facebook": "https://facebook.com/page",
  "twitter": "https://x.com/handle",
  "website": "https://example.sk",
  "portfolio": ["portfolio-01.jpg", "portfolio-02.jpg"]
}
```

### Fields

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `name` | yes | string | Max 255 chars. Shown on `/photographers`. |
| `email` | yes | string | Max 255 chars. **Upsert key** — re-import updates the same photographer. Not shown publicly. |
| `description` | no | string | Optional card bio. |
| `instagram` | no | string | Full URL, max 512 chars. |
| `facebook` | no | string | Full URL, max 512 chars. |
| `twitter` | no | string | Full URL, max 512 chars. |
| `website` | no | string | Full URL, max 512 chars. |
| `portfolio` | no | string[] | Ordered list of **local image filenames** beside the JSON. First image = card cover on `/photographers`. |

### Portfolio image rules

- Allowed extensions: `.jpg`, `.jpeg`, `.png` (case-insensitive).
- Use **filenames only** — not URLs, not paths (`portfolio-01.jpg`, not `./images/portfolio-01.jpg`).
- Array order = display order after import.
- Every listed file must exist in `import/photographers/` or import fails for that JSON.

### Minimal valid example

```json
{
  "name": "Anna Kovář",
  "email": "anna@example.sk"
}
```

### Full working example

See `import/photographers/example-photographer.json`.

---

## Locations (`import/locations/`)

### JSON structure

```json
{
  "name": "Castle Courtyard",
  "description": "Optional description.",
  "address": "Street, City",
  "latitude": 48.1422,
  "longitude": 17.0997,
  "previewGallery": ["preview-01.jpg", "preview-02.jpg"]
}
```

### Fields

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `name` | yes | string | Max 255 chars. **Upsert key** on re-import. |
| `description` | no | string | |
| `address` | no | string | Max 512 chars. |
| `latitude` | no | number | Decimal degrees. |
| `longitude` | no | number | Decimal degrees. |
| `previewGallery` | no | string[] | Local `.jpg`/`.jpeg`/`.png` filenames, same rules as photographer `portfolio`. |

### Full working example

See `import/locations/example-location.json`.

---

## What import does

1. Scan `import/photographers/*.json` and `import/locations/*.json`.
2. Validate each JSON (unknown fields are rejected).
3. Copy referenced images into namespaced paths under `public/`:
   - Photographers → `public/catalog/photographers/{email-slug}/`
   - Locations → `public/catalog/locations/{name-slug}/`
4. Upsert database records with served gallery URLs.
5. For photographers: assign a `login_hash` on insert, or on re-import when the row has none yet (for application review links — see [photographer-application-review.md](../architecture/photographer-application-review.md)).

**Slug examples:**

- `anna@example.sk` → `anna-at-example-sk`
- `Castle Courtyard` → `castle-courtyard`

**Served URL example:**

```
http://localhost:3002/catalog/photographers/anna-at-example-sk/portfolio-01.jpg
```

Base URL comes from `CATALOG_BASE_URL` (defaults to `http://localhost:3002`).

---

## How to run import

```bash
npm run import:catalog
```

Requires `DATABASE_URL` in `.env`.

The CLI reports per-file `created`, `updated`, `skipped`, or `failed`. A failed JSON does not block other valid files in the same run.

---

## Common mistakes

| Mistake | Result |
|---------|--------|
| URL in `portfolio` / `previewGallery` | Validation error |
| Missing image file listed in JSON | That entity skipped |
| Same image filename used by two JSON files in one folder | Collision error |
| Unknown JSON field (e.g. `phone`) | Validation error |
| Re-import with same `email` / `name` | Existing record updated, not duplicated |

---

## Adding a new photographer (checklist)

1. Create `import/photographers/your-name.json` with at least `name` and `email`.
2. Add portfolio JPEG/PNG files to `import/photographers/` with **unique filenames**.
3. List those filenames in `portfolio` in display order.
4. Run `npm run import:catalog`.
5. Verify on `/photographers` (first portfolio image = card cover).
6. Optional: run `npm run photographers:set-login-hashes` only if the row predates auto-hash import and still has no hash.

---

## Related docs

- Requirements: `docs/brainstorms/2026-07-07-catalog-import-requirements.md`
- Public page behavior: `docs/brainstorms/2026-07-08-photographers-page-requirements.md`
- Validator source: `src/import-catalog/validate.ts`
