---
title: File-based catalog import pipeline for photographers and locations
date: 2026-07-08
category: tooling-decisions
module: catalog-import
problem_type: tooling_decision
component: tooling
severity: medium
applies_when:
  - You need to ingest structured catalog entities and local image assets together
  - Teams want repeatable imports with validation and deterministic URL generation
tags: [catalog-import, json, images, upsert, cli]
---

# File-based catalog import pipeline for photographers and locations

## Context
The project needed a reliable way to import photographer and location records from flat files, including associated images, without manual DB edits or ad hoc scripts. The main friction was combining schema validation, collision checks, and media URL generation in one repeatable flow.

## Guidance
Use a single CLI-driven import pipeline that validates JSON payloads, scans source directories, checks filename collisions before writes, and then performs database upserts after assets are copied and URLs are built.

In this implementation, the import entry point is `scripts/import-catalog.ts`, while orchestration and safety checks are split into focused modules:
- `src/import-catalog/validate.ts` validates JSON structure and required fields.
- `src/import-catalog/scan.ts` and `src/import-catalog/copy-images.ts` handle source discovery and controlled asset copying.
- `src/import-catalog/build-urls.ts` centralizes gallery URL generation.
- `src/import-catalog/run-import.ts` coordinates end-to-end execution and reporting.
- `src/db/catalog-import.ts` performs idempotent upserts.

## Why This Matters
Bundling validation, media handling, and upsert logic into one tested flow reduces partial imports and data drift between filesystem assets and DB records. It also gives operators a predictable report and rollback surface instead of opaque one-off scripts.

## When to Apply
- During initial data bootstrap for photographers/locations from curated files.
- When repeating catalog syncs where records may already exist and must be updated safely.
- Any time image assets and metadata must remain aligned after import.

## Examples
Before this pattern:
- Data ingestion required manual or fragmented scripting, with higher risk of missing validation or path collisions.
- URL construction logic could diverge across scripts.

After this pattern:
- A single command path (`scripts/import-catalog.ts`) runs validation, scan/copy, URL building, and DB upsert in sequence.
- Tests around `build-urls`, `copy-images`, `scan`, `validate`, and `run-import` lock expected behavior and reduce regression risk.

## Related
- [Catalog import gallery URL normalization and slug namespacing](../logic-errors/catalog-import-gallery-url-normalization.md)
- docs/plans/2026-07-07-001-feat-catalog-import-plan.md
- docs/brainstorms/2026-07-07-catalog-import-requirements.md
