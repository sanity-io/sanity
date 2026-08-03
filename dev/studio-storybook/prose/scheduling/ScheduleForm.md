---
source: stories/scheduling/ScheduleForm.stories.tsx
title: 'Scheduling/Schedule Form'
blocks: 1
roundtrip: true
sourceHash: 938e3b012adfbf9c
---

<!-- @component -->

Every interactive behavior in this form flows from one rule: only a future instant is accepted, and the calendar enforces it before a value is ever typed.

|          |                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source   | `packages/sanity/src/core/scheduled-publishing/components/editScheduleForm/`, Studio-only (no DS equivalent)                                                                                                                                                                                                                                                                                                 |
| Tier     | SERVICE. A schema-driven datetime form: the shared scheduled-publishing `DateTimeInput` wrapped with a future-date constraint and a `{date}` payload. The value is a plain ISO string; the affordance is the service                                                                                                                                                                                         |
| Audit    | 🟡 partial (`content-versioning`, timezone legibility). The field accepts a date/time, but the zone the instant is read in is not surfaced inline on the field itself, reachable only through the calendar popover's time-zone affordance (see Scheduling, Time Zone Dialog). Scheduled publishing is deprecated in source, folding into Releases, which is the content-versioning context the audit flagged |
| Patterns | `content-versioning` · `schema-driven-forms`                                                                                                                                                                                                                                                                                                                                                                 |

The story mounts the real `EditScheduleForm` on the studio provider stack (`lib/testProvider.tsx`). The `{date}` value is controlled locally and echoed below the form so the emitted payload is visible.

The future-only rule shapes everything interactive here. `ScheduleForm` passes `customValidation: (d) => d > now` into the shared `DateTimeInput`: a typed instant in the past is rejected with a field-level "Date cannot be in the past." error and emits nothing, and `CalendarDay` renders every past day as a disabled button, so clicking one is silently a no-op. With an empty value the calendar opens on the current month, where most visible days are past, disabled, and, see below, barely visible. The "Pick a date (live emit)" story drives the full round-trip with real clicks so the emitted `{date}` payload is proven live.

> **Why it matters:** disabled calendar days are illegible in the dark scheme, a real defect flagged for the ledger. A disabled day takes the theme's disabled-card tokens, foreground #2a2d3f on background #13141b, roughly 1.2 to 1 contrast, functionally invisible day numbers. The studio's default and custom-built themes produce identical disabled-card colors, so this is exactly how the real Studio renders past days in this calendar in dark mode, not a harness artifact, and easily misread as a blank, clipped, or broken day grid, which it was, twice, in QA. Enabled days render normally.

The page closes in context: the schedule form in a real publish moment, picking when the "Anna Karenina" draft goes live, the emitted `{date}` payload shown below it.
