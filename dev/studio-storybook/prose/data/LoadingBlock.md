---
source: stories/data/LoadingBlock.stories.tsx
title: 'Lists & Data/LoadingBlock'
blocks: 1
roundtrip: true
sourceHash: a67c31ae5d1b2e76
---

<!-- @component -->

There is always a gap between asking for data and getting it, and something has to sit in that gap. This is Studio's simplest answer: a centred spinner, an optional delayed label, and no knowledge of what it is waiting for. It is honest and it is everywhere, though for list and pane regions a layout-shaped skeleton usually serves an editor better than a spinner over a blank frame.

|          |                                                                                                                                                                                                                                                                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/components/loadingBlock/LoadingBlock.tsx`, Studio-only (no DS equivalent)                                                                                                                                                                                                                                     |
| Tier     | CHROME. A pure loading-presentation atom: a centred `@sanity/ui` `Spinner` with optional delayed text, no domain logic and no knowledge of what it is waiting for                                                                                                                                                                       |
| Audit    | 🔴 needs-work (`skeleton-vs-spinner`, `instant-gratification`, `progress-indicator`). This is the bare spinner the audit found flashing over blank panes on reload. It gives no shape to what is loading; for list and pane regions the recommended direction is a layout-matched skeleton (the previews' `isPlaceholder` mode) instead |
| Timing   | invisible for the first 750ms, then fades in; optional text appears after 2000ms                                                                                                                                                                                                                                                        |
| Patterns | `skeleton-vs-spinner` · `instant-gratification` · `progress-indicator`                                                                                                                                                                                                                                                                  |

Timing is deliberate: the spinner is invisible for its first 750ms and then fades in (so a fast load never flashes a spinner), and the optional text only appears after 2000ms. In a static story that means the frame starts empty and the spinner arrives a beat later, that is the component working, not a broken story. `fill` absolutely-positions the block to cover a `position: relative` parent (used for pane overlays); without `fill` it stretches to fill its flow container with a 75px floor.

Harness notes: prop-driven, no store or provider stack (only the global i18n decorator, which supplies the "Loading" fallback string). The Current/Recommended pair reuses the shared fixture authors (`lib/mockDocumentPreviewStore.ts`) to show the same region as a spinner versus as skeleton previews.

> **Why it matters:** the delays are deliberate anti-flash timing. Nothing paints for the first 750ms and the label waits 2000ms, so a fast load never flashes a spinner at all. When a story frame starts empty and the spinner appears a beat later, that is the anti-flash timing doing its job.

The page closes **in context**: opening the "Anna Karenina" book. The pane chrome paints instantly while LoadingBlock fills the body until the document resolves.
