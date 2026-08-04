---
source: stories/actions/ContextMenuButton.stories.tsx
title: 'Actions & Commands/ContextMenuButton'
blocks: 2
roundtrip: true
sourceHash: 43305039b8514c5d
---

<!-- @component -->

ContextMenuButton is Studio's one more-actions affordance: the ellipsis at the end of a row or header that opens a menu of what can be done there. Because the glyph and the tooltip were decided once, an editor learns the mark in one place and recognises it everywhere else.

|          |                                                                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/components/contextMenuButton/ContextMenuButton.tsx`, Studio-only (no design-system equivalent)                                                                                            |
| Tier     | CHROME. A thin, single-purpose wrapper over the ui-components `Button`: it pins the horizontal-ellipsis icon and supplies one shared localized tooltip (`common.context-menu-button.tooltip`). No bespoke behaviour |
| Audit    | 🔴 needs-work (`accessible-labeling`), against the finding "≥6 icon-only controls with no accessible name"                                                                                                          |
| Ledger   | upstream **B#4**. The remedy is component work: derive the name from `tooltipProps.content` in the ui-components Button tooltip path, or widen this component’s props                                               |
| Patterns | `action-panel` · `accessible-labeling`                                                                                                                                                                              |

Normal usage is as the `button` of a `MenuButton`, which the first story shows; the rest sweep the props it re-exposes from `Button` (`tone`, `mode`, `size`, and the `selected` / `loading` / `disabled` states).

What no story here can show is the trigger being _named_. `ContextMenuButton` forwards `tooltipProps.content` to a `Tooltip`, which sets no `aria-label`, and its typed props pick only `mode`, `selected`, `size`, `tone`, `tooltipProps` and `loading` from `Button`, plus `disabled`, `hidden` and `onClick`. There is no way in. A caller cannot name this control without casting past the public API, so every button on this page is the demonstrated defect rather than a story with a fix in it, and none of them fakes one.

> **Why it matters:** treat a bare `ContextMenuButton` as unfinished. An editor using a screen reader hears nothing where a sighted editor sees "more actions", and no care at the call site repairs it. Where a named trigger is available as an alternative, use it: `CollapseMenu` accepts one through `menuButtonProps.button`, which is the only workaround that exists today.

The last story shows it in context: the "…" overflow on an author row (Leo Tolstoy) opening the document-actions menu, where the trigger actually lives, one per row.

<!-- @story Tones -->

The button tone maps straight through to `Button`/`@sanity/ui`.
