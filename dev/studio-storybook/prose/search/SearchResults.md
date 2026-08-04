---
source: stories/search/SearchResults.stories.tsx
title: 'Acme Content'
blocks: 10
roundtrip: true
sourceHash: fe27f14378fe7d71
---

<!-- @component -->

Everything downstream of a query lives here: the virtualized hit list and its row, the three ways a search can come up empty, and recent searches, the list that greets an editor before they have typed anything at all.

|          |                                                                                                                                                                                                                                                                                                                                                     |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/studio/components/navbar/search/components/searchResults/` (`SearchResults.tsx`, `item/SearchResultItem.tsx`, `item/SearchResultItemPreview.tsx`, `item/DebugOverlay.tsx`), `.../recentSearches/` (`RecentSearches.tsx`, `item/RecentSearchItem.tsx`), `.../NoResults.tsx`, `.../SearchError.tsx`, `.../Instructions.tsx` |
| Tier     | SERVICE                                                                                                                                                                                                                                                                                                                                             |
| Audit    | ⚪ not-audited                                                                                                                                                                                                                                                                                                                                      |
| Patterns | `search`                                                                                                                                                                                                                                                                                                                                            |

The Search Popover and Search Dialog pages are the two frames this content sits inside; this page looks at the content itself.

> **Why it matters:** a results list has more failure modes than a happy path, and this page pins each one separately rather than letting them blur into search working or not. No query, a query with zero hits, and a query that errors are three distinct states with three distinct messages, and conflating any two of them is a real support-ticket generator: someone reporting search is not finding anything when in fact nothing was ever typed. Recent searches carries its own smaller version of the same lesson: an editor's first-ever search and their tenth look identical in the popover shell, and only this list tells them apart.

<!-- @story ResultsNoHits -->

The `NoResults` story below in isolation; this is the same message reached the real way, embedded inside `SearchResults` after a query that genuinely matches nothing. `hasNoSearchResults` requires both `!result.hits.length` and `result.loaded` - a query that has not finished yet does not flash this message on its way to a result.

<!-- @story ResultsRequestFailed -->

`SearchError` embedded inside `SearchResults` the way it actually appears: `result.error` is truthy, so the whole results region swaps to the error message instead of an empty list. Nothing about this state is posed - the mock lake genuinely rejects the query and `useSearch` catches it.

<!-- @story ResultRow -->

`SearchResultItem` rendered on its own, outside a `CommandList`. It is honestly standalone: the component only needs `documentId` and `documentType` as data, and reaches into context (`useSearchState`, `useSchema`, `useDocumentPresence`, `useGrantsStore`) for everything else, the same way it would as a virtualized row. The badge, status dot and title come from `SearchResultItemPreview`, which subscribes to the real preview store for `article-launch` - a published-only document, so the status dot reads "published" with no draft indicator. Compare against `DraftOnlyRow` below.

<!-- @story DebugScore -->

Not reachable from a story-seeded state: `SearchResults` only renders `DebugOverlay` when `state.debug` is true, and that flag comes from `isDebugMode()` (a runtime check, not a reducer action), so there is no `SeedSearchState` prop that turns it on. `DebugOverlay` itself takes a `WeightedHit` as a plain prop, so this story hands it a fabricated one directly, stacked over the same result row it would sit on in production. Read it as: a tone-coded score chip in the corner, and on hover, the per-field breakdown that produced it - which paths matched, and how much each contributed.

<!-- @story ResultsEmpty -->

`NoResults` on its own. It carries no props - the two lines of copy are static translation strings - so what is worth pinning is simply that it exists as its own component rather than an inline conditional inside `SearchResults`, which is what lets `ResultsNoHits` above compose it in for real.

<!-- @story ResultsFailed -->

`SearchError` on its own, the sibling of `NoResults` above. Same shape (icon, title, help text) but critical tone throughout, and an `aria-live="assertive"` region, same as `NoResults` - both messages interrupt a screen reader rather than waiting to be found.

<!-- @story RecentSearchesEmptyPopover -->

The popover-shaped empty state. `filtersVisible` defaults to `true` (`SearchHeader` forces it whenever `!fullscreen`), so the `!filtersVisible && fullscreen` condition that would show `Instructions` is false on both counts, and the region renders nothing at all: no border, no copy, an empty box. That is deliberate, not a bug - the popover already shows the filter bar, so there is nothing left to hint at.

<!-- @story RecentSearchesEmptyFullscreen -->

`Instructions`, in the one place it actually mounts: `fullscreen` is true and `filtersVisible` is seeded `false` (the full-screen dialog's resting state before the filter toggle is opened). With no recent searches and no filters bar in the way, `RecentSearches` falls through to the `Instructions` branch instead of the search-history list. This is the counterpart to `RecentSearchesEmptyPopover`: same "nothing has happened yet" state, but the full-screen dialog has the vertical room to explain itself where the popover does not.

<!-- @story RecentSearchesWithHistory -->

Two seeded searches - a query narrowed to Article, and a bare query with no type narrowing - rendered exactly as `getRecentSearchTerms` would reconstruct them from local storage: newest first, with a "Clear recent searches" action underneath. Clicking a row dispatches `TERMS_SET` and re-runs that search for real (not simulated here, but wired the same as every other seeded story on this page). See the `seededRecentSearchesClient` comment above for why this needed a patched client rather than a plain `localStorage.setItem` call.
