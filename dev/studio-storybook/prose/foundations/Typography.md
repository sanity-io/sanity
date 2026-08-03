---
source: stories/foundations/Typography.stories.tsx
title: 'Foundations/Typography'
blocks: 5
roundtrip: true
sourceHash: 6db08b52592c1473
---

<!-- @component -->

Small-text legibility complaints spanned four surfaces in the captain’s review, and this page is the reference behind the fix: the real type scale, the measure band, the size floor, and the contrast baselines, every number read live from the theme.

|        |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source | catalog foundations; every number on this page is read live from the `@sanity/ui` theme (`useTheme_v2()` / `buildTheme()`), nothing is hardcoded, so if the theme moves, this page moves with it                                                                                                                                                                                                                                                                                                                                                                        |
| Tier   | n/a, foundations ground floor. This is the reference the component pages lean on: the real type scale, the measure band, the size floor, and the contrast baselines                                                                                                                                                                                                                                                                                                                                                                                                     |
| Audit  | 🔴 needs-work (night-shift charter law 8); small-text legibility complaints in the captain’s review spanned four surfaces: tooltip hotkeys (`@sanity/ui` KBD defaults to size 0 = 10px inside a 13px tooltip), relative timestamps (comments render `<Text muted size={0}>`, 10px _and_ muted), progress labels (floor-size but muted over thin tracks), and Vision errors (13px mono explaining results rendered at 16px). The contrast story adds the calendar’s disabled-day finding (≈1.3:1, functionally invisible, see the `CMS Patterns/Schedule Form` docblock) |

Studio sets type in **Inter** for text and headings and the OS mono stack for code, on a five-step text scale (10 / 13 / 15 / 18 / 21px) with headings running 13 → 38px. The scale is small on purpose: an editing surface wants one calm reading size (13px, `size={1}`, the body floor) with steps reserved for real shifts in hierarchy, not decoration. This page is the _principles_ half; the raw token tables (icon sizes, ascender/descender trims, weights, families) live on `Foundations/Design Tokens` → Type tokens. Each story below argues one of the four findings on its own page: the size floor, the measure band, and the contrast baselines.

<!-- @story TypeScale -->

The five-step text scale (10 / 13 / 15 / 18 / 21px) and the heading scale (13 → 38px), read live from the theme. 13px (`size={1}`) is the body floor: the calm reading size the rest of the interface is built around, with steps reserved for real shifts in hierarchy rather than decoration.

<!-- @story Measure -->

Prose reads comfortably at 45–75 characters per line; past ~75ch the eye’s return sweep measurably slows. At 13px Inter a character averages ≈6.4px, so the comfort band is roughly 290–480px of text column. Drag the column or use the presets and watch it enter and leave the band. The full width study (preset table + proposed RFC scale) lives on `Overlays & Navigation/Dialog`.

<!-- @story SizeFloor -->

Sizes are principled, not habits. The floor for anything a user must read is 13px (`size={1}`). 10px (`size={0}`) is instrumentation, counts, ticks, axis labels, and even there it must never also be `muted`: the floor is two-dimensional, px × contrast. Each finding below renders too-small-as-shipped beside its floor-size fix; the comparison is the argument.

<!-- @story ContrastBaselines -->

Body text on the base surface sits near 14.6:1 in both schemes; muted text near 5:1 (light) / 6:1 (dark), above the 4.5:1 AA bar for normal text. `muted` at 13px holds but `muted` at 10px does not, since smaller glyphs need more contrast, not less. Every tone’s ratio is computed live below, closing with the cautionary specimen: the real `CalendarDay`, whose disabled state inherits the theme’s disabled-card tokens at ≈1.3:1, below every threshold, effectively invisible in dark mode.
