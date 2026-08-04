---
source: stories/actions/Button.stories.tsx
title: 'Actions & Commands/Button'
blocks: 5
roundtrip: true
sourceHash: 188228444acabf78
---

<!-- @component -->

Button is Studio’s shared button component. Every action control in the product wraps it, inheriting its padding, tone mapping, and sizing.

|          |                                                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/ui-components/button/Button.tsx`, the Studio shadow of `@sanity/ui` Button                            |
| Tier     | CHROME. The most commodity control there is; the shadow only pins layout, maps tone, and requires a tooltip when icon-only |
| Audit    | 🔴 needs-work (`idempotency`). Submit controls that can double-fire; see the two Idempotency stories                       |
| Patterns | `button-groups` · `prominent-done` · `fitts-law`                                                                           |

The component enforces this at the type level. Size and padding come from a fixed scale rather than arbitrary values, and an icon-only button requires `tooltipProps`, so it cannot compile without an accessible label.

This page covers both layers. The `Primitive` story is the raw `@sanity/ui` button; every other story is the Studio wrapper. Comparing them shows what the wrapper removes from the primitive: layout and tone choices, and a nameless icon-only button.

> **Why it matters:** submit controls must not double-fire on a fast repeat click. The audit found buttons that stay enabled during an async write, so a second click posts a duplicate mutation. The fix disables the button and sets it to `loading` the instant it fires; the two Idempotency stories show the defect and the fix side by side.

The last story shows the component in its real context: the document header of the Anna Karenina draft. Publish, Review changes, and the overflow menu there are all instances of this one shared control.

<!-- @story Primitive -->

The raw `@sanity/ui` `Button`. The Studio shadow wraps this, adding fixed size/padding tokens and the icon-only tooltip contract.

<!-- @story IconOnlyWithTooltip -->

Icon-only buttons drop `text`, so `tooltipProps` is required by the type. This is the shadow's answer to the audit's `accessible-labeling` finding (icon controls with no accessible name).

<!-- @story IdempotencyCurrent -->

Reproduces the audit finding: click **Publish** twice quickly. Nothing disables the control while the write is in flight, so the second click posts a duplicate (counter goes past 1). This is the same class of defect as the comment send button that fires on every activation.

<!-- @story IdempotencyRecommended -->

The fix: on click the button flips to a `loading` + `disabled` pending state until the write resolves, so a second click is impossible and the count never exceeds 1. The action is idempotent from the UI down.
