---
source: stories/envisioned/VisibleSystemState.stories.tsx
title: 'War and Peace'
blocks: 1
roundtrip: true
sourceHash: 73392d0aa22fd865
---

<!-- @component -->

A list is a claim: these are your documents. Every sort, filter and perspective quietly amends that claim, and today the amendments are stored in closed menus, the system knows the list is scoped and sorted, and the editor is left to remember.

|          |                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anchor   | `Actions & Commands/CommandList` (Jump to item, the filter-as-navigation idiom) and `Overlays & Navigation/Tab`, the surfaces where applied view state currently vanishes into closed menus             |
| Evidence | audit `persistent-sort-filter`, `working-memory`, `selective-attention` (the perspective bar is easy to banner-blind); researcher’s brief §3, silent filters are one of the sixteen convergent failures |
| Patterns | `persistent-sort-filter` · `working-memory` · `selective-attention`                                                                                                                                     |

The envisioned fix is a state strip: one persistent row above the list carrying a chip per active, non-default view state, each chip naming its effect and each dismissible in place. It's the list's fine print promoted to the surface, so the reading of the list and the scope of the list are never separated.

> **Why it matters:** both panels below share one data pipeline and identical controls; only disclosure differs. Set the filter to author, then search "dune." The silent panel answers "No results," flatly wrong in the way that creates duplicate content. The strip panel answers with the hidden-match count and a one-click widen. Same engine, same data, opposite conclusions.
