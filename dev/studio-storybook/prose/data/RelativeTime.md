---
source: stories/data/RelativeTime.stories.tsx
title: 'Lists & Data/RelativeTime'
blocks: 1
roundtrip: true
sourceHash: 6f6909cba6a0934f
---

<!-- @component -->

RelativeTime never throws away the exact time when it renders a relative phrase: hovering reveals it, so a phrase like "2 minutes ago" and the instant it stands for are always one hover apart.

|             |                                                                                                                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source      | `packages/sanity/src/core/components/RelativeTime.tsx`, Studio-only (no DS equivalent)                                                                                                                                                                 |
| Tier        | CHROME. A formatting primitive. Turns a timestamp into a locale-aware relative phrase and emits a semantic `<time datetime>` element, with the absolute time tucked into `title` for hover. Studio uses it wherever "edited / published X ago" appears |
| Audit       | ⚪ not-audited as a unit. On the positive side of `datatips` / working-memory: the exact time is available on hover via the `title` attribute, so the relative phrase does not discard the absolute fact                                               |
| Determinism | `useRelativeTime` reads `Date.now()` internally unless a `relativeTo` instant is supplied; every story here pins `relativeTo` to a fixed `NOW` so phrases never drift                                                                                  |
| Patterns    | `datatips`                                                                                                                                                                                                                                             |

Thresholds it crosses (from the hook): past 10 seconds it moves to seconds, then minutes, hours, days, weeks; once months or years apart it switches to an absolute date.

> **Why it matters:** every story here pins the clock to a fixed instant, so the phrases on this page never drift between a read and the next. In a live Studio, the same component quietly refreshes itself on a timer, moving from "seconds" to "a minute ago" without a re-render anyone asked for.
