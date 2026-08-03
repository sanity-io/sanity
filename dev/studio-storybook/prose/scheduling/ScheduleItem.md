---
source: stories/scheduling/ScheduleItem.stories.tsx
title: 'A field guide to content modelling'
blocks: 1
roundtrip: true
sourceHash: 37d0138b8c763d41
---

<!-- @component -->

A document's place in the publish queue becomes something an editor can see and act on in a single row: the scheduled date, a live preview, a status indicator, and the actions available for that state.

|          |                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/scheduled-publishing/components/scheduleItem/`, Studio-only (no DS equivalent)                                                                                                                                                                                                                                                                                                  |
| Tier     | SERVICE. A composed list row: schedule date (time-zone formatted), the real document `Preview`, a status dot, and a permission-gated context menu. It reads its preview from the document preview store, so it is a service view, not a pure presentational leaf                                                                                                                                          |
| Audit    | 🟡 partial (`content-versioning`, `working-memory`). The row is where a document's scheduled position in the publish lifecycle is made visible. The state (scheduled, succeeded, cancelled) is carried by tone and a small indicator rather than an explicit label, and the surrounding scheduled-publishing tool is deprecated (folding into Releases), the content-versioning context the audit flagged |
| Patterns | `content-versioning` · `draft-publish-lifecycle`                                                                                                                                                                                                                                                                                                                                                          |

It is a composed view rather than a leaf, it reads its preview live from the document preview store, so what renders is the same prepare pipeline the rest of Studio runs. Each story mounts the real `ScheduleItem` (`type="tool"`) on the studio provider stack (`lib/testProvider.tsx`) with a seeded mock preview store (`lib/mockDocumentPreviewStore.ts`) and fixed timestamps. The three stories cover the three schedule states; the context-menu actions differ per state, edit, publish-now, delete when upcoming, clear when completed, delete when failed.

> **Why it matters:** the scheduled-publishing tool this row belongs to is deprecated and folding into Releases. Its folder is import-restricted, and storying its live UI carries a deliberate lint disable. Read this as documentation of a still-shipping surface on its way out, not a pattern to build new work on.
