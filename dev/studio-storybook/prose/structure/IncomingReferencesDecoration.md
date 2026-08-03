---
source: stories/structure/IncomingReferencesDecoration.stories.tsx
title: 'Article'
blocks: 2
roundtrip: true
sourceHash: d8d7c8f7d1932d0a
---

<!-- @component -->

This panel says which documents point back here, not how many: there is no total count anywhere in this family, only the resolved list itself.

|          |                                                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/structure/components/incomingReferencesDecoration/`                                                                 |
| Tier     | SERVICE. This tells an editor who else already points at the document they have open; it enriches the edit, it is not the act of editing |
| Audit    | 🔴 needs-work (`error-states`). See `CrossDatasetSourceFetchFailureCrashes` below                                                        |
| Patterns | `error-states` · `empty-states`                                                                                                          |

This is the "who links to this" panel a document type opts into by declaring it in its own render configuration. It is not an inspector, that is the sibling Incoming References Inspector page: this is a decoration inserted directly into the document form, next to the fields, scoped to whatever types the schema author names.

The list itself is capped at 100 for the search-and-link autocomplete, uncapped and un-numbered for the incoming list. A cross-dataset reference names its own dataset, but only when the schema author supplies a title or preview for it.

> **Why it matters:** two different fetch failures inside the same subsystem produce two different outcomes. A same-dataset fetch failure renders the honest empty state, correctly caught. A cross-dataset fetch failure that is not a not-found response is left uncaught and crashes the pane.

Most stories below hand-build the document pane and pane router context values directly, the same technique the header title page uses, because the only real dependency is a handful of fields off two contexts, not a whole resolved pane. The in-real-form story at the very end is the one exception: it mounts the real document pane with the decoration actually wired on the schema, to confirm the isolated harness above matches what the real configuration produces end to end.

<!-- @story CrossDatasetPostProcessingFailureSwallowed -->

Two references really exist and really came back from the API. What renders is the identical empty card `CrossDatasetEmpty` shows for a dataset with nothing in it.
