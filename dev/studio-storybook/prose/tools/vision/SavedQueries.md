---
source: stories/tools/vision/SavedQueries.stories.tsx
title: 'Lists & Data/Vision/SavedQueries'
blocks: 1
roundtrip: true
sourceHash: 6b70b616fd5eee8d
---

<!-- @component -->

SavedQueries holds two kinds of saved query in one list: personal queries persist in a local key-value store, private and always available; shared queries are real documents in the workspace dataset that a teammate can see.

|         |                                                                                                                                                                                               |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source  | `packages/@sanity/vision/src/components/QueryRecall`, backed by the `useSavedQueries` hook; a real, shipped Vision feature behind the collapse chevron on the tool’s right edge               |
| Tier    | SERVICE. Personal storage and shared storage, wired to one list                                                                                                                               |
| Storage | personal: Studio key-value store (`studio.vision-tool.saved-queries`), private, no dataset writes · shared: `vision.sharedQuery` documents in the workspace dataset, author-only edit/unshare |

The header carries a search box and an All / Personal / Shared tab filter; each row shows the query preview, a personal-lock or author avatar, and the saved date; the actions menu offers share, unshare, and delete; and a live query that has drifted from its saved form shows an "edited" dot and an Update button.

Here it runs on the Storybook harness: the **+** saves the current query into the harness key-value store and the row appears; click a row to load it; rename inline. Shared queries need a real workspace dataset, so the Shared tab is empty in the harness, that half is dataset-backed, not local.

> **Why it matters:** personal queries sit in the Studio key-value store, private, no dataset writes, while shared queries are real documents in the workspace dataset that teammates can see. Only the author can edit or unshare a shared one.
