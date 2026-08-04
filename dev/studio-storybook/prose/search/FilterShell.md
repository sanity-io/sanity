---
source: stories/search/FilterShell.stories.tsx
title: 'Search/Filter Shell'
blocks: 13
roundtrip: true
sourceHash: 3f36e23046cd327f
---

<!-- @component -->

Building a filter has its own chrome, separate from the filters it holds: the bar, the button that adds one, document-type narrowing, and the query field and sort control that sit beside it.

|          |                                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/studio/components/navbar/search/components/`                                                           |
| Tier     | SERVICE                                                                                                                          |
| Audit    | ⚪ not-audited                                                                                                                   |
| Patterns | `filters`                                                                                                                        |
| Harness  | closed states seeded straight into the reducer; open-popover states driven by a `play` function clicking the real trigger button |

The operator-specific value inputs (string, number, date, and the rest) are catalogued separately under Filter Inputs; this page is everything around them. Closed states seed straight into the reducer with `SeedSearchState`, plus a small local `SeedFieldFilters` that resolves a field filter by path against the live, schema-derived definitions rather than a guessed id. Open-popover states are driven by a `play` function that clicks the real trigger button, because `AddFilterButton`, `DocumentTypesButton` and `SortMenu` all manage their own open state internally and take no controlled prop from outside.

> **Why it matters:** the add-filter menu is not configured anywhere. It is derived from the schema every time it opens, walking field definitions that are themselves built out of the workspace schema. What a studio can filter by is a consequence of how it was modelled, not a list someone maintains by hand.

<!-- @story FiltersAtRest -->

No filters, no narrowed types: the document-types control reads "All types" and the add-filter button is the only other affordance in the row. The clear-filters button does not render at all here - `Filters` only shows it once there is something to clear.

<!-- @story FiltersApplied -->

Two real filters, built with `buildSearchFilter` against the live schema-derived field definitions rather than typed by hand: "Title contains release" and "Featured is True". Each renders as its own pill with its own close button, and the clear-filters button has appeared now that there is something for it to clear. This is the bar at rest with filters on it; the story below shows what happens the instant a filter is added.

<!-- @story FilterJustAdded -->

The state immediately after picking a filter from the Add Filter menu: `Filters` tracks `lastAddedFilter` and gives it `initialOpen`, so the value editor is already open and focused. It is a genuinely good nudge - a filter with no value set does nothing, so the product does not make you find the pill and click it. Given its own story, and its own vertical room, because seeing it appear over a resting filter bar reads as a rendering fault rather than the deliberate hand-off it is.

<!-- @story AddFilterOpen -->

The field list a moment after opening, grouped under a single "All fields" header because no document type is narrowed yet. Every entry comes from `definitions.fields`, itself walked out of the fixture schema by `createFieldDefinitions`: add a string, a boolean, a date or a reference field to a schema and it shows up here unasked, which is the point of this control.

<!-- @story AddFilterFiltered -->

The same field list narrowed by a plain substring match against each field's title path - "read" leaves only "Reading time (minutes)" standing. There is no fuzzy search and no ranking here, just `includes`, so typing a whole word is the reliable way to find a field.

<!-- @story DocumentTypesClosed -->

With nothing narrowed, the button reads "All types" rather than naming every document type the workspace has. A generic label is the honest one when the search genuinely spans everything.

<!-- @story DocumentTypesOpen -->

The three fixture document types, sorted alphabetically by title - the same ordering the field list in Add Filter uses. Selecting one narrows search to that type and, downstream, narrows the field list Add Filter offers to fields that type actually has.

<!-- @story DocumentTypesSelected -->

The button label now names the narrowed type instead of "All types". This is the same `state.terms.types` that Add Filter reads to decide whether to group its own field list by document type, so this story and the narrowed Add Filter story above are two views of one piece of state.

<!-- @story SortMenuClosed -->

The default ordering is relevance ("Best match"), the only ordering whose GROQ sort is computed from the query itself rather than from a document field; the rest are plain field sorts on `_createdAt` or `_updatedAt`.

<!-- @story SortMenuOpen -->

The five orderings the workspace ships with, grouped by axis - relevance, then created, then updated - with dividers between the groups. The current ordering shows `pressed`, the same treatment a selected menu item gets everywhere else in Studio.

<!-- @story SearchHeaderEmpty -->

Just the query field, no close button and no filter toggle. Both are full-screen-only chrome - `SearchHeader` reads `state.fullscreen` to decide - because the popover has its own dismissal (clicking outside) and its filter bar cannot be hidden at all (see `Filters`, which forces `filtersVisible` on whenever `!fullscreen`).

<!-- @story SearchHeaderWithQuery -->

A clear button appears once there is a query to clear, and the search icon is ready to swap for the spinner the moment `result.loading` goes true (see the Search Popover stories for that state held open).
