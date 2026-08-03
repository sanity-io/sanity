---
source: stories/search/filters/DocumentTypesMenu.stories.tsx
title: 'Search/Document Types Menu'
blocks: 4
roundtrip: true
sourceHash: 6fed855844d2df64
---

<!-- @component -->

Behind the "All types" (or narrowed-type) button sits a search box over the workspace's selectable document types, partitioned into a Selected group and the rest, and the row it is built from.

|          |                                                                                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/studio/components/navbar/search/components/filters/documentTypes/` (`DocumentTypesPopoverContent.tsx`, `items/DocumentTypeFilterItem.tsx`) |
| Tier     | SERVICE                                                                                                                                                              |
| Audit    | ⚪ not-audited                                                                                                                                                       |
| Patterns | `filters`                                                                                                                                                            |

<!-- @story NoneSelected -->

The three fixture document types in one flat, unheadered list - `useGetDocumentTypeItems` only inserts a "Selected" header once `itemsSelected.length > 0`, and there is nothing selected yet to earn one. No clear button either, for the same reason: `Filters` in the source components only shows one once `selectedTypes.length > 0`.

<!-- @story OneSelected -->

A "Selected" header, `Article` under it with its checkmark, a divider, then `Author` and `Page` unheadered below, and a clear-type-filters button along the bottom edge. The selected/unselected split is a snapshot taken when the popover opens (`selectedTypesSnapshot`), not the live selection - toggling a type inside an already-open popover moves its row between the visual groups only the next time the popover opens, not immediately, so a person can finish a multi-type selection without rows jumping around mid-click.

<!-- @story NoMatches -->

Typed narrowing against a string no fixture type title contains: `documentTypeItems.length` drops to zero and the `CommandList` is replaced entirely by localized "no matches" copy, the same pattern `AddFilterPopoverContent` uses for its own empty state.
