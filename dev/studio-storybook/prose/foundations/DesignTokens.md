---
source: stories/foundations/DesignTokens.stories.tsx
title: 'Foundations/Design Tokens'
blocks: 1
roundtrip: true
sourceHash: efbe8d78b50f2331
---

<!-- @component -->

Studio’s token stack has three layers, palette, theme and runtime, and every value on this page is read live rather than transcribed, so this is where you find a value fast and trust it.

|        |                                                                                                                                                                                                                                                                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source | catalog foundations; the palette layer is `@sanity/color` (the exact copy `packages/sanity` compiles against) and every other value is read from the `@sanity/ui` theme at render time, nothing on this page is transcribed                                                                                                     |
| Tier   | n/a, foundations ground floor: the raw values. Principles and reading specimens live on `Foundations/Typography`; semantic tone resolution lives on `Foundations/Theme Matrix`; this page is where you find a value fast                                                                                                        |
| Audit  | ⚪ not-audited as a unit, but two families carry program findings: **Container** holds the very tokens the Dialog width study proposes renumbering (`Overlays & Navigation/Dialog`), and the card-property pipeline shown here is the mechanism behind the disabled-contrast finding (`Foundations/Theme Matrix` → Card states) |

**Palette** (`@sanity/color`): 9 hues × 11 tints plus black and white, inert hex values, no meaning attached. **Theme** (`buildTheme()`): the palette resolved into semantic slots, tones, card states, spacing, radii, shadows, containers, layers, breakpoints. **Runtime** (`--card-*`): when a `Card` takes a tone, it emits ~73 CSS custom properties onto its DOM element; every descendant styles itself with `var(--card-…)` and never sees a hex. The stories below walk the stack top to bottom, each family with name, value, and a live specimen. How the layers connect is taught on `Foundations/Design System Tooling`.

Families on this page: **Palette** · **Card properties** (the runtime layer, computed live) · **Space** · **Radius** · **Shadows** · **Container** · **Layer** · **Breakpoints** · **Avatar sizes** · **Type tokens**.
