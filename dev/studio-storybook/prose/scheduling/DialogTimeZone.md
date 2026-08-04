---
source: stories/scheduling/DialogTimeZone.stories.tsx
title: 'Scheduling/Time Zone Dialog'
blocks: 1
roundtrip: true
sourceHash: 7521c317351eaf7f
---

<!-- @component -->

DialogTimeZone names the time zone a scheduled publish is interpreted in, rather than leaving it a silent assumption.

|          |                                                                                                                                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/components/timeZone/DialogTimeZone.tsx`, Studio-only (no DS equivalent)                                                                                                                      |
| Tier     | SERVICE. A scope-parameterised time-zone picker (`scheduledPublishing` / `contentReleases` / `input`) built on the DS `Dialog` and `@sanity/ui` `Autocomplete`, persisting the choice per-scope to the key-value store |
| Audit    | 🟢 holds (timezone legibility). This dialog is the resolution to the time-zone legibility gap the audit flagged on datetime entry; it is the affordance the Schedule Form field opens                                  |
| Patterns | `content-versioning`                                                                                                                                                                                                   |

It lists every IANA zone ordered by offset behind a searchable autocomplete, offers a one-click select-local-time-zone shortcut, and names the scope the choice applies to in a line at the top, so the interpreting zone is always explicit and selectable. The story mounts the real dialog on the studio provider stack (`lib/testProvider.tsx`). The zone list is computed from the runtime `Intl` database, so the exact rows reflect the environment; selection is persisted through the mock client and therefore inert here.

> **Why it matters:** the chosen zone is persisted per scope, scheduled publishing, content releases, input, not globally. Setting it for scheduled publishing does not move it for releases. Each surface remembers its own interpreting zone on purpose.

The last story shows the picker in context: opened for the content releases scope while scheduling the "Spring campaign" release, naming where "publish at 9am" means.
