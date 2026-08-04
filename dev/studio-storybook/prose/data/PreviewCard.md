---
source: stories/data/PreviewCard.stories.tsx
title: 'Lists & Data/PreviewCard'
blocks: 1
roundtrip: true
sourceHash: 58229bdcb70baab2
---

<!-- @component -->

PreviewCard is the selectable container behind every list row and reference result. It gives Studio's lists their consistent hit-area, radius, and selection look, and quietly tells the preview inside it whether it is the active row.

|          |                                                                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source   | `packages/sanity/src/core/components/previewCard/PreviewCard.tsx`, Studio-only (no DS equivalent)                                                                                                                        |
| Tier     | SERVICE. The selectable row container behind every list item and reference preview; carries the `selected` / `pressed` interaction state and the context (`usePreviewCard`) a preview reads to know it is the active row |
| Audit    | 🟢 holds (`cards`). The audit scored Studio's card-based list rows as a pattern that holds: consistent hit-area, radius, and selection affordance across lists, reference inputs, and menus                              |
| Patterns | `cards`                                                                                                                                                                                                                  |

A thin `styled(@sanity/ui Card)` that forwards all `CardProps` (`tone`, `radius`, `padding`, `selected`, `pressed`, `as`, …) and adds two things a plain `Card` lacks: it publishes a `PreviewCardContext` so a child preview can call `usePreviewCard()` to read its own selected state, and it overrides `[data-ui="TextWithTone"]` colour to `inherit` in the `selected` / `pressed` / `:active` states, without which a toned status label would keep its own colour and clash with the selected-row background.

Harness notes: prop-driven, no store or provider stack (only the global theme + i18n decorators). Rows contain a real `DefaultPreview` filled from the shared fixture authors (`lib/mockDocumentPreviewStore.ts`) so selection reads against real content. The `as="button"` story is the one to keyboard-focus (Tab) to see the focus ring the card renders.

> **Why it matters:** selecting a row re-colours the content inside, not just its background. The colour override is what keeps selection legible: without it, a coloured status label would hold its own hue against the selected-row background and clash.
