---
source: stories/actions/Button.stories.tsx
title: 'Actions & Commands/Button'
blocks: 5
roundtrip: true
sourceHash: 7095712289157e1c
---

<!-- @component -->

Almost everything a person _does_ in Studio lands on a button, so the decision is made once: one shared control, and every action inherits its padding, its tone, and its sizing.

|          |                                                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/ui-components/button/Button.tsx`, the Studio shadow of `@sanity/ui` Button                            |
| Tier     | CHROME. The most commodity control there is; the shadow only pins layout, maps tone, and requires a tooltip when icon-only |
| Audit    | 🔴 needs-work (`idempotency`). Submit controls that can double-fire; see the two Idempotency stories                       |
| Patterns | `button-groups` · `prominent-done` · `fitts-law`                                                                           |

Reach for the Studio `Button` and you inherit the padding, the tone mapping, and the sizing the rest of the app already uses. There is no way to ship a control a little too tall or a little too loud, and an icon-only button cannot even compile without a tooltip, so it is never nameless.

This page covers both layers at once. The `Primitive` story is the raw `@sanity/ui` button; every other story is the Studio wrapper. Read them side by side and the wrapper’s entire job becomes visible: it takes choices away, on purpose.

> **Why it matters:** a button must make double-submission impossible. The audit found submit controls that stay live during an async write, so a rapid second click posts a duplicate. The fix is to flip into a pending state the instant it fires; the two Idempotency stories show the shipped behaviour and the repair side by side.

The page closes _in context_: the document header of the Anna Karenina draft, where Publish, Review changes, and the overflow menu are all this one shared control.

<!-- @story Primitive -->

The raw `@sanity/ui` `Button`. The Studio shadow wraps this, adding fixed size/padding tokens and the icon-only tooltip contract.

<!-- @story IconOnlyWithTooltip -->

Icon-only buttons drop `text`, so `tooltipProps` is required by the type. This is the shadow's answer to the audit's `accessible-labeling` finding (icon controls with no accessible name).

<!-- @story IdempotencyCurrent -->

Reproduces the audit finding: click **Publish** twice quickly. Nothing disables the control while the write is in flight, so the second click posts a duplicate (counter goes past 1). This is the same class of defect as the comment send button that fires on every activation.

<!-- @story IdempotencyRecommended -->

The fix: on click the button flips to a `loading` + `disabled` pending state until the write resolves, so a second click is impossible and the count never exceeds 1. The action is idempotent from the UI down.
