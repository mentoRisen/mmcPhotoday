---
title: Catalog import gallery URL normalization and slug namespacing
date: 2026-07-08
category: logic-errors
module: catalog-import
problem_type: logic_error
component: tooling
symptoms:
  - "Imported gallery URLs could include a malformed path segment such as //catalog/... when CATALOG_BASE_URL ended with /"
  - "Different entities using the same source filename could end up with indistinguishable served URL paths"
  - "Re-import behavior became harder to reason about because gallery identity depended on raw filenames instead of entity and slug"
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags: [catalog-import, gallery-urls, slug, normalization, collision]
---

# Catalog import gallery URL normalization and slug namespacing

## Problem

The catalog import pipeline could produce gallery URLs that were either malformed or not uniquely scoped per entity. In practice, this showed up as risk of double-slash URL paths when operators provided a trailing slash base URL, and risk of shared filename collisions when multiple entities reused common image names like `hero.jpg`.

## Symptoms

- Imported gallery URLs could include a malformed path segment such as `//catalog/...` when `CATALOG_BASE_URL` ended with `/`.
- Different entities using the same source filename could end up with indistinguishable served URL paths if URLs were not slug-namespaced.
- Re-import behavior became harder to reason about because gallery identity depended on raw filenames instead of entity + filename.

## What Didn't Work

- Relying on raw string concatenation with unnormalized `baseUrl` was brittle because environment values are operator-provided and may include trailing slashes.
- Treating filenames as globally meaningful in URL construction did not hold for flat import folders where repeated names are expected across entities.
- Depending only on import-folder uniqueness constraints was insufficient for public URL safety; URL generation still needed deterministic namespacing.

## Solution

The importer now constructs gallery URLs through a dedicated helper that normalizes base URL input and always scopes paths by entity type and slug.

- URL normalization and namespaced path construction live in `src/import-catalog/build-urls.ts`.
- The helper strips trailing slashes from `baseUrl` and emits URLs in the form: `${base}/catalog/${entityType}/${slug}/${filename}`
- Import orchestration in `src/import-catalog/run-import.ts` calls `buildGalleryUrls(...)` for both photographers and locations before database upsert.
- Files are copied into matching slug-based public directories via `copyGalleryImages(...)` so on-disk assets and stored URLs remain aligned.

```typescript
// src/import-catalog/build-urls.ts
const normalizedBase = baseUrl.replace(/\/+$/, "");
return filenames.map(
  (filename) =>
    `${normalizedBase}/catalog/${entityType}/${slug}/${filename}`,
);
```

Concrete references:

- `src/import-catalog/build-urls.ts`
- `src/import-catalog/run-import.ts`
- `src/import-catalog/copy-images.ts`
- `scripts/import-catalog.ts` (base URL source: `CATALOG_BASE_URL` with localhost fallback)

## Why This Works

The fix removes ambiguity from both URL composition and asset identity:

- Base URL normalization guarantees a stable prefix regardless of operator formatting in environment variables.
- Slug namespacing ensures that `hero.jpg` for photographer `slug-a` and `hero.jpg` for photographer `slug-b` resolve to different URLs, preventing cross-entity collisions.
- Using one shared URL builder in the import path keeps photographer and location behavior consistent and testable.
- Aligning copy destination and URL schema (`public/catalog/{entityType}/{slug}/{filename}`) guarantees that persisted URLs map directly to real files.

## Prevention

- Keep URL generation centralized in `buildGalleryUrls(...)`; do not rebuild gallery paths ad hoc in callers.
- Preserve regression tests that lock behavior:
  - `src/import-catalog/build-urls.test.ts` verifies trailing-slash normalization.
  - `src/import-catalog/build-urls.test.ts` verifies slug-based namespacing.
  - `src/import-catalog/run-import.test.ts` verifies imported URLs include expected namespaced segments.
- Continue validating import constraints (collision checks and missing-file checks) before upsert so invalid gallery state never reaches DB records.
- Treat `CATALOG_BASE_URL` as an explicit import input and keep defaults conservative (`http://localhost:3002`) for local runs.

## Related Issues

- [File-based catalog import pipeline](../tooling-decisions/file-based-catalog-import-pipeline.md)
- `docs/brainstorms/2026-07-07-catalog-import-requirements.md`
- `docs/plans/2026-07-07-001-feat-catalog-import-plan.md`
