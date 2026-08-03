---
source: stories/foundations/DesignSystemTooling.stories.tsx
title: 'Foundations/Design System Tooling'
blocks: 1
roundtrip: true
sourceHash: cc557efe6c0a8313
---

<!-- @component -->

This page explains how the design system actually works, not what the tokens are, and several of this program’s findings trace straight back to these mechanisms: portal theming, native `color-scheme` emission, and the icon packaging split.

|        |                                                                                                                                                                                                                                                                                                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source | catalog foundations; mechanisms demonstrated on the real `@sanity/ui` runtime, the palette/theme/property layers it explains are cataloged on `Foundations/Design Tokens` and `Foundations/Theme Matrix`                                                                                                                                                               |
| Tier   | n/a, foundations ground floor: not _what_ the tokens are, but **how the design system is built and consumed**. Several of this program’s findings hinged on exactly these mechanisms; where they do, the story links to the evidence                                                                                                                                   |
| Audit  | ⚪ not-audited as a unit; this page is the technical backdrop for findings that are: portal theming (the contract’s §5 gotcha, verified on `Overlays & Navigation/Dialog` in dark mode), `color-scheme` emission vs owning the controls (`Forms & Input/DateInputs`), container tokens (the Dialog width-study RFC), and the icon packaging note (findings ledger #12) |

### How a theme is built

Three functions make the stack. `@sanity/color` supplies the inert palette (9 hues × 11 tints). `buildTheme(config?)`, from `@sanity/ui/theme`, resolves it into every semantic slot: five tones × two schemes × interaction states, plus space, radius, shadows, containers, layers and breakpoints. A custom theme is `buildTheme({...})` with token-level overrides (hue/tint token strings, not hexes), or `createColorTheme()` for a fully custom color resolution; `getContrastRatio()` ships alongside them in the same entry. Studio itself just calls `buildTheme()`: `packages/sanity/src/core/theme/index.ts` exposes it behind a deprecated lazy `defaultTheme` proxy, and the legacy `buildLegacyTheme` maps old Studio v2 props onto it.

### The two trees (the mechanism behind half our findings)

`ThemeProvider` puts the theme and scheme into **React context**. When a `Card` (or any toned surface) renders, it resolves its tone slice and **emits ~73 `--card-*` CSS custom properties onto its own DOM element**, and from that point on, descendants like `Text`, `Code`, `KBD` and `Badge` style themselves with `var(--card-…)` and never touch a hex. So theme data travels **two different trees**: React context follows the _component_ tree (and crosses portals), CSS custom properties follow the _DOM_ tree (and stop at a portal boundary, because the portaled DOM is not a descendant). The **Property pipeline** story shows the emission live; the **Portal reach** story renders the proof of the split. The practical lesson: a scheme carried only as a class on an app container never reaches `document.body` portals. That is why this catalog’s theme decorator stamps the scheme globally, and why the contract requires verifying portaled layers (an open Dialog in dark mode) before calling theming done.

### `color-scheme`: the native-UI seam

A toned Card also emits the CSS `color-scheme` property (`dark` or `light`) on its element. That is what keeps _incidental_ native UI, scrollbars, form-control chrome, the OS date-picker popup, legibly matched to the surrounding surface. It is a safety net, not a design: the native picker still ignores the type scale, the tones and the keyboard model, which is the audit’s `own the controls` case (law 7). The **Scheme emission** story shows the seam live with a bare `<input type="date">` under both schemes; the designed answer is the `Forms & Input/DateInputs` native-controls pair.

### The icon pipeline

`@sanity/icons` ships 236 symbols two ways: a generic `<Icon symbol="add-circle"/>` plus an `icons` map at the main entry, and one tree-shakeable component per symbol on subpaths (`import {AddCircleIcon} from '@sanity/icons/AddCircle'`). The **main entry exports only `{Icon, icons}` at runtime**, and as of 5.2.0 the types say so honestly: every named `*Icon` on the root is declared `never` with a deprecation pointing to its subpath (which updates findings ledger #12, written when the types still suggested otherwise). This catalog therefore imports named icons from subpaths everywhere. The **Icon pipeline** story renders the full map, clustered by a curated taxonomy (`iconCategories.ts`; the package ships none), searchable across tabs, at the 25px crisp size by default (the only integer scale of the 25-unit viewBox, ledger #33) with 17/21/33 comparison toggles.
