---
source: stories/structure/DocumentPane.stories.tsx
title: 'Book'
blocks: 1
roundtrip: true
sourceHash: b7f73f64ca817a77
---

<!-- @component -->

Open any document in the product and this is the surface in front of everyone: the form filled in, the title renamed, the tabs switched between, the button pressed to publish. It is the single component that walks the schema, builds a value tree from it, and turns every keystroke into a patch.

|          |                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------ |
| Source   | `packages/sanity/src/structure/panes/document` (Studio-only, no design-system equivalent)              |
| Tier     | CORE. The host of the editing engine: schema walk, value tree, patch write, plus the publish lifecycle |
| Audit    | 🔴 needs-work (`draft-publish-lifecycle`, `similarity`)                                                |
| Patterns | `draft-publish-lifecycle` · `schema-driven-forms`                                                      |

This is where the actual work happens: the document editor itself, the whole right-hand surface a person lands in when they open one document, its header, the schema-driven form, the view tabs, and the publish and status bar along the bottom.

The real editor is mounted here, not a header or status bar in isolation, over a real document store. The pair machinery runs for real, snapshots served from fixtures, a listener held open on a mock welcome event, grants come from a fixture access list, and edits type into the real local-first patch pipeline, nothing persists, mutations land in the mock client's own transaction log. The document header, context menu, view tabs, the form, and the status bar, publish button, action menu, status line, are all live.

The events feed is served empty, a shaped response, so the pane renders its real "no events" state rather than a network error. Revision and event list contents are out of scope for this harness tier.

> **Why it matters:** lifecycle state, draft, published, edited, is carried by color-only status dots of identical shape and size, and a version or variant chip can surface before any version exists. This is the core surface every editor lives in, so those two findings do not touch one screen. They touch every document in the product.
