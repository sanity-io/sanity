---
source: stories/beta/Canvas.stories.tsx
title: 'Book'
blocks: 1
roundtrip: true
sourceHash: ca8b8cdceb1e0816
---

<!-- @component -->

Moving a document out of Studio into another app is a trust moment for the author, and this flow earns that trust by never redirecting silently: it runs a preflight, and when the mapping into Canvas would alter content, it shows the diff and asks first.

|          |                                                                                                                                                                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/canvas/actions/LinkToCanvas/`, Studio-only (no design-system equivalent)                                                                                                                                                |
| Flag     | `apps.canvas.enabled`, default off (`AppsOptions.canvas`, `core/config/types.ts`, plus a `fallbackStudioOrigin`). When enabled, the plugin registers the Edit in Canvas / Link to Canvas / Unlink document actions and the linked-document banner |
| Tier     | SERVICE. A cross-app hand-off (Studio to Canvas) layered on the document, not editing-core, not chrome                                                                                                                                            |
| Audit    | ⚪ not-audited. Canvas is a companion app outside the CMS-pattern benchmark; storied here to document the in-Studio integration surface                                                                                                           |
| Patterns | `content-versioning`                                                                                                                                                                                                                              |

That confirmation body is the substance worth studying here. Linking a document to Canvas runs a preflight that maps the Studio document into Canvas's model; when that mapping would change content, the dialog shows the diff and asks the author to confirm before redirecting. `useLinkToCanvas` is deep and backend-bound (it resolves the Studio appId, POSTs a preflight, then resolves the organization redirect), so the _diff and redirecting states require a live Canvas backend_ and are not reachable offline.

What this file stories instead: the confirmation diff body (`LinkToCanvasDiff`) rendered directly with fixture documents, a real `@sanity/diff` comparison through the real `ChangeList`, which is the substantive content of the dialog, plus the dialog’s two deterministic offline states (missing document id, Studio app not found), driven by a stub AppId cache. The linked-document banner (`CanvasLinkedBanner`) is a separate surface, storied under Document Banners/In a live pane → "Canvas linked", not duplicated here.

> **Why it matters:** the whole flow is opt-in, `apps.canvas.enabled` defaults off, so none of this runs, no dialog, no redirect, no banner, unless a workspace turns Canvas on.
