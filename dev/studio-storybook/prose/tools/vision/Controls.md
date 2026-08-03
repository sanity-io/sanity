---
source: stories/tools/vision/Controls.stories.tsx
title: 'Lists & Data/Vision/Controls'
blocks: 1
roundtrip: true
sourceHash: ab68fdb952627df0
---

<!-- @component -->

Perspective is the quiet control that changes everything: raw, published, and drafts return different content for the same query, so a result that looks wrong is often just the wrong perspective selected.

|        |                                                                                                                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source | `packages/@sanity/vision/src/components/VisionGuiHeader`, the strip across the top of the tool: the Dataset, API version, and Perspective selectors, plus the read-only query URL with its copy button |
| Tier   | SERVICE. Every selector is the real `@sanity/ui` `Select`, live; the API-version select carries an "Other…" option with real validation                                                                |

Change any selector and the header updates. The API-version select carries an Other… option that swaps in a free-text input with real validation (`v` + a date), so it can target an unreleased API day. The perspective control sits beside an info popover explaining `raw` / `published` / `drafts`. The query URL only appears once a query has run; its copy link writes the exact request to the clipboard.

> **Why it matters:** whichever perspective is selected gets baked into the copied query URL, so sharing a link also shares an assumption about which content it reads.
