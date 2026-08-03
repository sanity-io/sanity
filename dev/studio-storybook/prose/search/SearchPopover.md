---
source: stories/search/SearchPopover.stories.tsx
title: 'Search/Search Popover'
blocks: 9
roundtrip: true
sourceHash: 85bca09894f60107
---

<!-- @component -->

On a wide viewport, search lives in a popover anchored to the navbar, holding the query field, the filter bar, the sort control, and the results list.

|          |                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source   | `packages/sanity/src/core/studio/components/navbar/search/components/SearchPopover.tsx`                                                          |
| Tier     | CHROME                                                                                                                                           |
| Audit    | ⚪ not-audited                                                                                                                                   |
| Patterns | `search`                                                                                                                                         |
| Harness  | stories seed the reducer directly instead of typing, so each declares the state it is about; execution downstream of that state is entirely real |

Its full-screen sibling, the Search Dialog, is the same machine in a different frame.

> **Why it matters:** search is the one navbar surface that is not a component but a small application. A provider holds the whole state in a reducer, terms, filters, type narrowing, ordering, results, the filter engine derives itself from the schema, and the search hook runs a real GROQ query. These stories drive that loop rather than posing it: the query compiles to GROQ and is evaluated against fixture documents, so the hits are genuinely searched. Change the query in the story source and the results change accordingly.

<!-- @story Default -->

The resting state: open with no query, showing the header and filter bar over an empty body rather than a "no results" message. An empty query is not a search that found nothing, and the surface is careful never to conflate them. (The instructional copy belongs to the full-screen dialog: `RecentSearches` renders `Instructions` only when `fullscreen` is set, so the popover stays quiet.)

<!-- @story WithResults -->

The working state. "release" is compiled to a GROQ query and evaluated against the fixture documents; the three hits are the documents that genuinely match, ordered by the strategy's relevance weighting, each with its document type.

<!-- @story NoResults -->

A genuine empty result set: the query runs, matches nothing, and the surface says so. Note this is a different state from the instructions above, and the distinction is why both exist.

<!-- @story EmptyDataset -->

The same no-results treatment reached a different way: the query is fine, the studio simply has no content yet. It is the state every new studio starts in, and the copy is not tailored to it.

<!-- @story RequestFailed -->

A real rejected query, not a posed error prop: the mock lake throws, `useSearch` catches it, and the reducer moves to its error state. This is the state a flaky connection produces, and the one most likely to be untested in real life.

<!-- @story Loading -->

The in-flight state, held open by a lake that never resolves. In a live studio this is a few hundred milliseconds, and it is real, and otherwise impossible to look at.

<!-- @story NarrowedToType -->

The same "release" query restricted to articles, so the matching Page drops out of the results. Type narrowing is a separate axis from filters: it constrains what is searched, not which values qualify.

<!-- @story OrderedByDate -->

The same result set re-ordered. Ordering is part of search state, not a view preference, because it changes the GROQ that runs: the relevance ordering sorts on computed scores while a date ordering sorts in the query itself.
