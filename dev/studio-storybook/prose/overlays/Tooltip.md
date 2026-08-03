---
source: stories/overlays/Tooltip.stories.tsx
title: 'Overlays & Navigation/Tooltip'
blocks: 1
roundtrip: true
sourceHash: cad51e07b1b30f00
---

<!-- @component -->

A tooltip is a supplement, never the only home for information a person must act on, and this page exists because Studio does not always honor that. The shadow itself is a careful, standardized wrapper; the audit finding is in what gets asked of it.

|          |                                                                                                                                                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/ui-components/tooltip/Tooltip.tsx`, Studio shadow of `@sanity/ui` `Tooltip`                                                                                                                             |
| Tier     | SERVICE. Fixes padding/arrow/shadow, standardizes the open delay, portals, and adds hotkey rendering                                                                                                                         |
| Audit    | 🔴 needs-work (`error-messages`, `accessible-labeling`). Studio hides real error text behind a hover-only icon tooltip, and ships six or more icon-only controls with no accessible name. Its intended `datatips` role holds |
| Patterns | `datatips` · `error-messages` · `accessible-labeling`                                                                                                                                                                        |

The shadow removes the `arrow` / `padding` / `shadow` props and applies shared defaults: `animate`, a 400ms open delay (`TOOLTIP_DELAY_PROPS`), `placement="bottom"` with corner fallbacks, and `portal`. A `string` `content` is wrapped in `Text size={1}`; a `hotkeys` array renders inline. The source itself notes: strongly prefer a short `string` `content` for i18n.

Current puts the validation message where only a hover reveals it; Recommended shows the message inline and lets the tooltip add detail. The accessible-labeling pair contrasts a bare icon button with one that carries both a tooltip and an `aria-label`.
