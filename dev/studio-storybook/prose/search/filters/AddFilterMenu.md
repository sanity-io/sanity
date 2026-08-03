---
source: stories/search/filters/AddFilterMenu.stories.tsx
title: 'Search/Add Filter Menu'
blocks: 5
roundtrip: true
sourceHash: 2fce5103dd80fbe4
---

<!-- @component -->

Behind the Add Filter button sits a search box over a schema-derived list, built from a group header, a filter row that disables itself once already active, and a tooltip that explains a filter before it is chosen.

|          |                                                                                                                                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/studio/components/navbar/search/components/filters/addFilter/` (`AddFilterPopoverContent.tsx`, `items/MenuItemFilter.tsx`, `items/MenuItemHeader.tsx`, `items/FilterTooltip.tsx`) |
| Tier     | SERVICE                                                                                                                                                                                                     |
| Audit    | ⚪ not-audited                                                                                                                                                                                              |
| Patterns | `filters`                                                                                                                                                                                                   |

> **Why it matters:** the menu is not configured, it is derived. Every row is walked from the active workspace schema, so adding a filterable field to a schema makes a row for it appear here unasked. See Filter Shell, Add-filter popover open and narrowed, for the same content reached by clicking the real trigger and typing into it.

<!-- @story Ungrouped -->

With no document type narrowed, `createFilterMenuItems` returns one flat group: the pinned filters (Edited at, Created at, Contains document/image/file) followed by every field across every fixture document type under a single "All fields" header - there is nothing yet to group by.

<!-- @story NarrowedToOneType -->

The same content once search is narrowed to `Article`: the field list now groups by which document types share a field, so fields unique to `Author` and `Page` drop out of the "shared" view. This is the same `documentTypesNarrowed` state that Document Types Menu narrows, seen from the other control that reads it.

<!-- @story MenuItemActive -->

The same Title row, but the identical filter is seeded into `state.filters` first, so `getFilterKey` finds a match and `isAlreadyActive` disables the button - clicking it would add a second, redundant copy of a filter already on the bar, so the menu prevents that rather than letting a person discover it by trying.

<!-- @story Tooltip -->

The tooltip `MenuItemFilter` wraps every row in, forced open with `visible` so it renders without a hover. `summary` is a `text` field present only on `Article`, so this is the case with the most content: the field's raw name (monospaced), and the list of document types it is used in, truncated past ten with a "+N more" suffix the same way `DocumentTypesPill` truncates. A field with no description and only one document type would show a shorter tooltip - this row was chosen to show every section at once, not because it is typical.
