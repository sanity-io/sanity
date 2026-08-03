---
source: stories/envisioned/SelectionSide.stories.tsx
title: 'Anna Karenina'
blocks: 1
roundtrip: true
sourceHash: 2e5bc443bac168d1
---

<!-- @component -->

Studio has no selection model at all yet, so when it grows one it gets to choose where the affordance lives, and the two candidate templates are not interchangeable: management lists take a leading checkbox well; pickers take a trailing checkmark.

|          |                                                                                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Anchor   | `Actions & Commands/CommandList`, the Items with selection story, which proves the engine already supports `ariaMultiselectable` and `getItemSelected` and marks selection with a trailing checkmark                                             |
| Evidence | audit `bulk-actions` (ch8: primary lists have no multi-select/checkboxes/bulk ops) and `jakobs-law`; researcher’s brief §7, the selection model is the floor of the trust ladder, competitively confirmed by both leaders’ real selection models |
| Patterns | `bulk-actions` · `jakobs-law`                                                                                                                                                                                                                    |

A leading well is visible at rest, it announces that multi-select exists before any interaction, the discoverability `bulk-actions` dies without, it sits at the reading edge so selected rows form one scannable column, and it is where every neighbouring product puts it (Jakob's law: WordPress, Payload, Contentful all lead). A trailing checkmark is right where selection is transient and singular, palettes and pickers, because it keeps the reading edge clean and the affordance only matters on the active row.

Both variants run on the real `CommandList` with real multi-select state; the row template is the only thing that changes. Two proof devices: the glance test story masks each list after one second and asks how many rows were selected, and the at-rest story strips all hover state so each template answers the discoverability question cold: does this list even do multi-select?

> **Why it matters:** the aligned leading column survives a one-second glance; the trailing glyphs mostly do not. Run the glance test on yourself before trusting the argument, the meters below are measured live, not asserted.
