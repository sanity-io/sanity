---
source: stories/foundations/ThemeMatrix.stories.tsx
title: 'Foundations/Theme Matrix'
blocks: 1
roundtrip: true
sourceHash: 22a6b7721c33efd0
---

<!-- @component -->

Every swatch on this page is a live component, not a screenshot, so the color matrix and its measured contrast numbers can never drift apart.

|        |                                                                                                                                                                                                                                                                                                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source | catalog foundations; swatches are real `@sanity/ui` `Card`s and `Button`s under nested `ThemeProvider`s (one per scheme), annotations read the same `buildTheme()` data the providers render with, so swatch and number cannot disagree                                                                                                            |
| Tier   | n/a, foundations ground floor. The light × dark × tone matrix the original organization contract (§1) called for and no component page could own                                                                                                                                                                                                   |
| Audit  | ⚪ not-audited as a unit, but the **Card states** story surfaces the theme fact behind a real finding: the `disabled` column sits at ≈1.3:1 in both schemes, which is exactly what makes the calendar’s disabled days functionally invisible (see `Foundations/Typography` → Contrast baselines, and the `CMS Patterns/Schedule Form` ledger note) |

Studio’s color system is **two schemes × five tones** (`default`, `primary`, `positive`, `caution`, `critical`), each tone resolving a full set of surfaces: `base` (the tinted card the tone paints), `solid` (filled buttons and badges), `muted`, and stateful `card` colors (enabled → hovered → pressed → selected → disabled). Components never hold hexes; they name a tone and the scheme resolves it. Every swatch here is a live component under a scheme-pinned provider rather than a painted rectangle.

Click any cell in **Base tones** to open it in the inspector: background, foreground, border and focus-ring hexes with computed WCAG ratios. **Solid tones** shows the filled layer that buttons wear. **Card states** renders the interaction ladder for the scheme picked in the toolbar, and flags the disabled rung’s contrast.
