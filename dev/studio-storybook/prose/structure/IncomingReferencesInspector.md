---
source: stories/structure/IncomingReferencesInspector.stories.tsx
title: 'Article'
blocks: 2
roundtrip: false
sourceHash: e7055fdb7099b1eb
---

<!-- @component -->

One subsystem fetches from two different sources, and only one of its two surfaces bothers to say which kind of reference it is waiting on.

|          |                                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/structure/panes/document/inspectors/incomingReferences/`                                     |
| Tier     | SERVICE. A document-level "who links to this" panel, opened from the pane menu, independent of any specific field |
| Audit    | 🔴 needs-work (`similarity`). See the loading-copy comparison below                                               |
| Patterns | `similarity`                                                                                                      |

Unlike the sibling decoration page, this panel is not scoped to a schema author's types list; it shows every referencing document of every type. It is the header and close button around the list that queries and groups every document referencing the one currently open, same-dataset documents in one set of sections and cross-dataset documents in another, falling back to one shared empty message only when both sources are empty and settled.

> **Why it matters:** this reuses the decoration package's own fetch functions verbatim, including its uncaught cross-dataset crash and its silently emptied post-processing failure. Neither defect is specific to the decoration; this inspector calls the identical functions and inherits both.

<details><summary><b>A dead branch exists in the underlying list component, and it cannot be storied.</b></summary>

The module-local section renderer shows an empty-message card when it receives zero documents, but every section this file mounts is built only from groups that already have at least one document. That branch is unreachable through the real component, and because the section renderer is not exported, there is no way to reach it with a hand-built prop either, short of editing component source, which is out of scope here.

</details>

<!-- @story NotTheHistoryInspector -->
<!-- READ ONLY: this description interpolates values at runtime. -->

INCOMING_REFERENCES_INSPECTOR_NAME is "${INCOMING_REFERENCES_INSPECTOR_NAME}", HISTORY_INSPECTOR_NAME is "${HISTORY_INSPECTOR_NAME}": two separately registered inspectors, opened through the identical `inspect` router param mechanism.
