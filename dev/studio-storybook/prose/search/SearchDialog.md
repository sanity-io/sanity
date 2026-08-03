---
source: stories/search/SearchDialog.stories.tsx
title: 'Search/Search Dialog'
blocks: 8
roundtrip: true
sourceHash: 154663389166dbba
---

<!-- @component -->

Below a breakpoint, Studio swaps the anchored search popover for a full-screen dialog: the same provider, the same filter engine, the same query execution, in a frame that owns the whole screen.

|          |                                                                             |
| -------- | --------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/studio/components/navbar/search/SearchDialog.tsx` |
| Tier     | CHROME                                                                      |
| Audit    | ⚪ not-audited                                                              |
| Patterns | `search`                                                                    |

> **Why it matters:** the pair is a good lesson in what responsive means for a stateful surface. Nothing about the machine changes between the two, only the frame and one flag. That flag changes behaviour in one visible way: the empty state's instructional copy renders only in the full-screen frame, so the resting state here has copy and the popover does not.

<!-- @story Default -->

The resting full-screen state: no query, the filter bar showing, and an empty body. The instructional copy is one step away - see "Instructions, with filters collapsed" below - because `RecentSearches` shows it only when the filter bar is hidden.

<!-- @story WithResults -->

The same fixture documents, genuinely searched, in the full-screen frame. Compare with the popover story: identical machine, identical results, different container.

<!-- @story NoResults -->

A real empty result set at full width, where the emptiness is much more conspicuous than it is in the popover. Worth looking at both, because the same state carries very different weight in the two frames.

<!-- @story RequestFailed -->

The error state, produced by a genuinely rejected query rather than a posed prop.

<!-- @story NarrowedToType -->

Type narrowing applied: the same query, restricted to articles, so the matching Page drops out. The header shows the active narrowing and offers to clear it.

<!-- @story Instructions -->

The only state in search that addresses a first-time user, and it is reachable through a narrow gate: `RecentSearches` renders `Instructions` only when `!filtersVisible && fullscreen`. So it appears on a narrow viewport, with the filter bar collapsed and nothing searched yet - and never in the popover at all, because `SearchHeader` forces `filtersVisible` back to true whenever `!fullscreen`.

<!-- @story FiltersCollapsed -->

Results with the filter bar toggled away, giving the list the full height. This is the collapse the header toggle produces, and it exists only in the full-screen frame.
