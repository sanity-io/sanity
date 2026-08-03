---
source: stories/search/RecentSearchItem.stories.tsx
title: 'Search/Recent Search Item'
blocks: 5
roundtrip: true
sourceHash: ab18278adf03fc41
---

<!-- @component -->

One row of the recent-searches list has to fit a clock icon, the query text, a type-narrowing pill, and any filter pills onto a single line, all reconstructed from one stored search.

|          |                                                                                                                |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/studio/components/navbar/search/components/recentSearches/item/RecentSearchItem.tsx` |
| Tier     | SERVICE                                                                                                        |
| Audit    | ⚪ not-audited                                                                                                 |
| Patterns | `search`                                                                                                       |

Recent Searches (see Search, Results, "Recent searches, with history") is the only place this mounts, always inside a list of its siblings; this page pins the row on its own with the value shapes that change what it shows.

> **Why it matters:** the query's length is subtracted from the type pill's character budget, so a longer query genuinely squeezes the type pill down before it squeezes the query text. The row is fitting two independently important pieces of information onto one line rather than truncating whichever comes first.

<!-- @story QueryOnly -->

The plainest recent search: free text, no type narrowing, no filters. `value.types.length > 0` gates the type pill and `value.filters?.map(...)` gates the filter pills, so both are simply absent from the row rather than rendering as empty chips - a search this bare looks exactly as bare as it was.

<!-- @story QueryWithType -->

"pricing" narrowed to `Article`: the `DocumentTypesPill` in Filter Presentation now has a real caller. `availableCharacters` is computed as `maxVisibleTypePillChars - value.query.length`, so this pill has more room than the truncated example below.

<!-- @story QueryWithFilters -->

The fullest row this component renders: query text, a type pill, and one `FilterPill` per entry in `value.filters`, all in the same flex-wrap row so a search with several filters wraps onto a second line rather than overflowing. Each filter pill is the exact `FilterPill` from Filter Presentation - clicking this whole row dispatches `TERMS_SET` with these filters attached, restoring the search precisely as it was saved.

<!-- @story LongQueryTruncatesTypes -->

All three fixture types selected, alongside a long query. `availableCharacters` goes negative before `getDocumentTypesTruncated` runs, and that function always keeps the first type regardless of length - so the pill degrades to "Article +2 more" rather than disappearing or overflowing the row, even though there is technically no room left for it at all.
