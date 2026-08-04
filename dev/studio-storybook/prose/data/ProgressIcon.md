---
source: stories/data/ProgressIcon.stories.tsx
title: 'Lists & Data/ProgressIcon'
blocks: 1
roundtrip: true
sourceHash: 5512b64435e373f3
---

<!-- @component -->

ProgressIcon is a determinate progress indicator: when the total is known, a filling arc says exactly how much is done, not just that something is happening.

|          |                                                                                                                                                                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/ui-components/progressIcon/ProgressIcon.tsx`, Studio-only (no DS equivalent)                                                                                                                                         |
| Tier     | CHROME. A stateless SVG primitive: it draws a determinate progress arc from a single number, no domain logic                                                                                                                              |
| Audit    | 🟢 holds (`progress-indicator`). A correct determinate indicator. The adjacent `spinners-loading` negative in the audit lives on the Delete/Unpublish confirm Dialog (stuck on "Looking for referring documents…"), not on this component |
| Patterns | `progress-indicator` · `spinners-loading`                                                                                                                                                                                                 |

Renders a pie-style fill that sweeps clockwise from 12 o’clock as `progress` goes from `0` to `1`, sized at `1em` and inheriting `currentColor`, so it scales and tints with the enclosing `<Text>`. It is the determinate counterpart to `@sanity/ui` `Spinner`; Studio uses it in `ValidationProgressIndicator` to show validation completing across a Release. Prefer it over an indeterminate spinner whenever the total is known (`done / total`), per the `progress-indicator` pattern.

> **Why it matters:** the source's own JSDoc comment is wrong. It calls the prop a percentage from 0 to 100, but the implementation treats it as a fraction from 0 to 1. Passing 50 instead of 0.5 renders as a barely visible sliver, not half the circle.
