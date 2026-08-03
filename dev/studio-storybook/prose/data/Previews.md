---
source: stories/data/Previews.stories.tsx
title: 'Lists & Data/Previews'
blocks: 1
roundtrip: true
sourceHash: 2d9be5aca234497e
---

<!-- @component -->

On reload the list region paints chrome over a blank white pane with no skeleton, and a bare spinner flashes on the dark theme, even though the fix already ships inside these components as a built-in skeleton mode.

|          |                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/components/previews/`, Studio-only (no DS equivalent)                                                                                                                                                                           |
| Tier     | SERVICE. The shared preview-rendering layer every list row, pane header, and reference card renders a resolved document through; maps one document to one of four general layouts (plus the portable-text family) and owns each layout's loading skeleton |
| Audit    | 🔴 needs-work (`skeleton-vs-spinner`, `instant-gratification`). The fix already ships inside these components as the built-in `isPlaceholder` skeleton; the Current/Recommended pair below wires it up against the real component                         |
| Patterns | `skeleton-vs-spinner` · `instant-gratification` · `cards`                                                                                                                                                                                                 |

The general family has four layouts, `compact`, `default`, `media`, `detail`, each accepting `title` / `subtitle` / `media` / `status` and, when `isPlaceholder` is set, rendering a `@sanity/ui` `Skeleton`/`TextSkeleton` shaped to that layout's final geometry (so the skeleton and the loaded row occupy the same box, no layout shift). The portable-text family (`block`, `blockImage`, `inline`) renders the same pipeline inside the block editor and has no placeholder branch.

Harness notes: these are pure presentational components, they take content as props and render no data of their own, so no `DocumentPreviewStore` or provider stack is needed (only the global i18n + theme decorators, for the "Untitled" fallback and theming). Sample content is borrowed from the shared fixture authors (`lib/mockDocumentPreviewStore.ts`); `media` is a gradient standing in for a resolved image asset, so no image-URL builder/client runs.

> **Why it matters:** the fix needs no new component, only wiring up the skeleton mode these layouts already ship. Until then, a reload paints chrome over a blank pane and, on the dark theme, a bare spinner flashing with no shape to what is loading.
