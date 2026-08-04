---
source: stories/overlays/TooltipOfDisabled.stories.tsx
title: 'Overlays & Navigation/Tooltip/Of Disabled'
blocks: 1
roundtrip: true
sourceHash: deacdacea277ba92
---

<!-- @component -->

TooltipOfDisabled fixes a Tooltip's dead zone on a disabled button for a mouse, and stops there: a disabled button dispatches no pointer events, so a Tooltip placed directly on it never fires and a disabled control has no way to explain why it cannot be used.

|          |                                                                                                                                                                                                                                                                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/components/TooltipOfDisabled.tsx`, Studio-only (no design-system equivalent)                                                                                                                                                                                                                                                                |
| Tier     | CHROME. A single-purpose wrapper solving one DOM quirk: wrapping the disabled control in a `<div>` gives the Tooltip a live hover target                                                                                                                                                                                                                              |
| Audit    | 🔴 needs-work (`accessible-labeling`). It fixes the hover case but not the accessibility case: no `aria-label` / `aria-describedby` is set on the control, so keyboard and screen-reader users reach a disabled button with no announced reason. Same class of gap the audit logged against Studio’s icon-only controls, and the same one `ContextMenuButton` carries |
| Patterns | `accessible-labeling` · `error-messages`                                                                                                                                                                                                                                                                                                                              |

Note the inverted `disabled` semantics: it disables the _tooltip_, not the control, so the stories model the real idiom `disabled={!controlIsDisabled}`. The Recommended pair keeps the hover tooltip but also wires `aria-describedby` to a visually hidden reason node, so the explanation is programmatic, not pixels-only.
