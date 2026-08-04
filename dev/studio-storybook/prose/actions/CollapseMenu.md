---
source: stories/actions/CollapseMenu.stories.tsx
title: 'Actions & Commands/CollapseMenu'
blocks: 1
roundtrip: true
sourceHash: c3969b5f71f184dd
---

<!-- @component -->

CollapseMenu keeps a Studio toolbar usable as its pane narrows: it watches how much room is left and sheds the least important controls into an overflow menu rather than letting anything wrap, clip, or push the document title off its own header.

|           |                                                                                                                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source    | `packages/sanity/src/core/components/collapseMenu/CollapseMenu.tsx`, Studio-only (no design-system equivalent)                                                                                                      |
| Tier      | SERVICE. A reusable responsive-layout capability rather than a single feature: it renders a row of actions, watches which of them still fit, collapses them to icon-only, then spills the remainder into a "…" menu |
| Mechanism | `IntersectionObserver` driving three render phases: expanded, collapsed, overflow                                                                                                                                   |
| Audit     | ⚪ not-audited as a unit. Adjacent to ch4 `collapsible-panels` and the mobile `filmstrip` / `touch-tools` findings; the natural home for the mobile fix rather than a defect itself                                 |
| Patterns  | `action-panel` · `collapsible-panels`                                                                                                                                                                               |

Document headers and pane headers mount it for exactly that reason: hand it a row of actions and it takes over deciding what fits.

Collapse is driven by real width measurement, not a breakpoint, so the `Responsive` story exposes a width slider and you can watch the bar shed actions live. An action that has overflowed keeps its icon, label, tone and divider when it reappears as a menu item. The same set reads the same at any width.

> **Why it matters:** the default overflow trigger is a bare `ContextMenuButton`, whose public API cannot carry an accessible name (its tooltip is hover-visual only). So the moment any action can collapse into the "…" menu, the control holding the rest of your toolbar goes unnamed. Pass your own named trigger via `menuButtonProps.button`, as the `Collapsed` story does.

The last story shows it in context: the "Anna Karenina" document header toolbar shedding its actions into a named overflow as the pane narrows.
