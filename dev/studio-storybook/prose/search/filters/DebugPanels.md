---
source: stories/search/filters/DebugPanels.stories.tsx
title: 'Search/Debug Panels (unreachable)'
blocks: 1
roundtrip: true
sourceHash: 0504e5be63856f33
---

<!-- @component -->

Four debug readouts exist for the filter engine, built for Studio engineers working on search itself, and no editor will ever see them: a hardcoded flag keeps every one of them permanently dark in any shipped build.

|             |                                                                                                                                                                                                                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source      | `packages/sanity/src/core/studio/components/navbar/search/components/filters/debug/` (`_DebugFilterQuery.tsx`, `_DebugDocumentTypesNarrowed.tsx`, `_DebugDocumentTypes.tsx`, `_DebugFilterValues.tsx`)                                                                                                            |
| Tier        | SERVICE                                                                                                                                                                                                                                                                                                           |
| Audit       | ⚪ not-audited                                                                                                                                                                                                                                                                                                    |
| Patterns    | `filters`                                                                                                                                                                                                                                                                                                         |
| Mounted by  | `.../components/filters/Filters.tsx` (`DebugFilterQuery`, `DebugDocumentTypesNarrowed`) and `.../components/filters/filter/FilterPopoverContent.tsx` (`DebugDocumentTypes`, `DebugFilterValues`), both behind `{DEBUG_MODE && (...)}` where `DEBUG_MODE` (`constants.ts:11`) is `export const DEBUG_MODE = false` |
| Cannot show | that any editor, in any studio, will ever see this rendered. It genuinely cannot happen without a source edit                                                                                                                                                                                                     |

The four are a raw filter GROQ fragment, the document types a field narrows to, the document types the whole search is narrowed to, and a filter's raw name, operator and value. See the code comment above for why one combined page beats four separate ones.
