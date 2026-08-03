---
source: stories/scheduling/DialogTimeZone.stories.tsx
title: 'Scheduling/Time Zone Dialog'
blocks: 1
roundtrip: true
sourceHash: e53e5693c4406147
---

<!-- @component -->

Schedule a document to publish at 9am and the obvious question is: 9am where? This dialog is Studio's answer, naming the interpreting zone explicitly instead of leaving it a silent assumption.

|          |                                                                                                                                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/components/timeZone/DialogTimeZone.tsx`, Studio-only (no DS equivalent)                                                                                                                      |
| Tier     | SERVICE. A scope-parameterised time-zone picker (`scheduledPublishing` / `contentReleases` / `input`) built on the DS `Dialog` and `@sanity/ui` `Autocomplete`, persisting the choice per-scope to the key-value store |
| Audit    | 🟢 holds (timezone legibility). This dialog is the resolution to the time-zone legibility gap the audit flagged on datetime entry; it is the affordance the Schedule Form field opens                                  |
| Patterns | `content-versioning`                                                                                                                                                                                                   |

It lists every IANA zone ordered by offset behind a searchable autocomplete, offers a one-click select-local-time-zone shortcut, and names the scope the choice applies to in a line at the top, so the interpreting zone is always explicit and selectable. The story mounts the real dialog on the studio provider stack (`lib/testProvider.tsx`). The zone list is computed from the runtime `Intl` database, so the exact rows reflect the environment; selection is persisted through the mock client and therefore inert here.

> **Why it matters:** the chosen zone is persisted per scope, scheduled publishing, content releases, input, not globally. Setting it for scheduled publishing does not move it for releases. Each surface remembers its own interpreting zone on purpose.

The page closes in context: the picker opened for the content releases scope while scheduling the "Spring campaign" release, publish at 9am answered with where.
