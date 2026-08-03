---
source: stories/actions/StatusButton.stories.tsx
title: 'Actions & Commands/StatusButton'
blocks: 1
roundtrip: true
sourceHash: b5baf1ab2f620644
---

<!-- @component -->

A control that also carries state is one of the harder things to get right, and Studio has exactly one component for it: when a button needs to say more than its label, that a document has warnings, that a connection is live, this is what it becomes.

|               |                                                                                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source        | `packages/sanity/src/core/components/StatusButton.tsx`, Studio-only (no design-system equivalent)                                                                                                                        |
| Tier          | CHROME. A thin styled wrapper over the ui-components `Button`: forces `mode="bleed"`, absolutely positions a 4×4px status `Dot` in the top-right corner tinted by tone, and makes `aria-label` a _required_ prop         |
| Audit         | 🔴 needs-work (`similarity`). The status signal is the dot, and the dot is colour only: same 4×4 circle, same position, for every tone. In grayscale, caution and critical and positive collapse into one identical mark |
| Contradiction | `disabled` is typed to accept a boolean _or_ a `{reason}` object, but the component runs `Boolean(disabledProp)`. The object collapses to bare `true` and the reason never reaches the DOM                               |
| Patterns      | `similarity` · `accessible-labeling`                                                                                                                                                                                     |

A control that also carries state is one of the harder things to get right, and Studio has exactly one component for it. When a button needs to say more than its label (this document has warnings, that connection is live, something wants a look) this is what it becomes. Unlike most Studio triggers it _requires_ an `aria-label`, so a stateful control here can never ship without a programmatic name, which is more than the rest of the chapter can claim.

On the tags: `working-memory` was considered and does not fit. That finding is about system state the interface forgets to persist or show, an applied sort for instance. StatusButton renders current state rather than remembered state, so this page tags `similarity` alone. The open `similarity` gap is that the dot carries its meaning in colour and nothing else; the `Current` and `Recommended` pair swaps in a per-status shape and shows both rows through a grayscale filter, which is where the difference stops being arguable.

> **Why it matters:** the `disabled` prop lies. Its type invites you to attach an explanation and the component discards it, so an editor who lacks publish permission is told only that they cannot publish, never why. Until it is fixed upstream, explain a disabled StatusButton with a tooltip and treat the `reason` field as though it were not there. `DisabledReasonIsDropped` shows the two buttons being indistinguishable.

The page closes _in context_: the status bar of the _Anna Karenina_ document, its publish state carried by a labelled caution dot in the header corner.
