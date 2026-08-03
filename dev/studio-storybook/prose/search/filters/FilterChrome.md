---
source: stories/search/filters/FilterChrome.stories.tsx
title: 'Search/Filter Chrome'
blocks: 2
roundtrip: true
sourceHash: ff52fc6a78e1e59e
---

<!-- @component -->

Every filter popover is assembled from small pieces that are not the popover itself: an operator icon, the path-and-name label above a filter's form, a search header the Add Filter and Document Types popovers both reuse, and a focus-locked card wrapper. None of them run a search or hold state of their own; they render whatever they are handed.

|          |                                                                                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/studio/components/navbar/search/components/filters/common/` (`FilterIcon.tsx`, `FilterDetails.tsx`, `FilterPopoverContentHeader.tsx`, `FilterPopoverWrapper.tsx`) |
| Tier     | SERVICE                                                                                                                                                                                     |
| Audit    | ⚪ not-audited                                                                                                                                                                              |
| Patterns | `filters`                                                                                                                                                                                   |

> **Why it matters:** the icon and the details both resolve their content by looking a filter up in the live, schema-derived definitions rather than reading anything off the filter object itself beyond its name. A filter whose name no longer matches any definition, a stale one carried over from a schema that has since changed, does not throw or show an error glyph, it falls back silently to a generic icon and a blank title. Distinguishing that from a filter that genuinely has no icon takes reading the fallback, not looking at it.

<!-- @story PopoverContentHeader -->

The search box both the Add Filter and Document Types popovers open with, in isolation. Not just a `TextInput`: it wraps `CustomTextInput` for the shared clear-button styling, and its own clear button (`clearButton={!!typeFilter}`) only renders once there is something to clear. Type into the field on canvas to watch the button appear.
