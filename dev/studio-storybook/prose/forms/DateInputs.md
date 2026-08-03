---
source: stories/forms/DateInputs.stories.tsx
title: 'Event'
blocks: 1
roundtrip: true
sourceHash: 56d27451ca5b76d6
---

<!-- @component -->

An unparseable date never reaches `onChange`: the field keeps its last valid value and flags the problem only as a native outline whose message is hidden until the author happens to hover it, so a red field can look like a data problem when it is only a display one.

|          |                                                                                                                                                                                                                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/DateInputs/`, Studio-only, no DS equivalent                                                                                                                                                                                                                                                 |
| Tier     | SERVICE. Date and datetime inputs are schema-driven form primitives layered over the shared calendar picker; the value is a plain string, the affordance is the service                                                                                                                                                           |
| Audit    | 🔴 needs-work (`forgiving-format`, `inline-validation-timing`, `error-messages`). An unparseable entry never reaches `onChange`; the parse error is surfaced only as `customValidity` on the native input (a red outline whose message is hidden until hover), the same hover-hidden pattern the audit flagged on slug validation |
| Patterns | `forgiving-format` · `inline-validation-timing` · `error-messages` · `visual-framework`                                                                                                                                                                                                                                           |

The date and datetime fields, a calendar picker for a plain day, or a day plus a time (and optionally a timezone) for an exact instant. These are the fields an editor reaches for to set a publish date or an event time. `DateInput` captures a plain day (`YYYY-MM-DD`); `DateTimeInput` captures an exact instant and, when the schema turns it on, shows a timezone chip so a reader in another zone still sees the right moment. Both open the same shared calendar, and both store a simple string, the affordance is the value they add on top.

Both stories mount the real inputs on the studio provider stack (`lib/testProvider.tsx`). `DateInput` renders bare (day granularity, `YYYY-MM-DD`). `DateTimeInput` carries its own field header, change bar and, when the schema enables it, a timezone chip; it reads `_id` via `useFormValue`, so it is wrapped in a `FormValueProvider`.

Harness note: parse errors are transient (they appear only after you type an unparseable value), so the "invalid" stories are interactive, type e.g. `not-a-date` and the field outlines red. `useReportParseError` is a no-op outside a `ParseErrorsProvider`, so the parse message is not routed to a document-level panel here; the input's own `customValidity` still fires.

**Native controls breaking through the design (`visual-framework`).** A second, screenshot-verified finding, independent of the validation one. Inside the calendar, the month control is a native `<select>` (`@sanity/ui` `Select`, styled `<select>`, `calendar/Calendar.tsx:475`) and the time control is a native `<input type="time">` (`components/inputs/DateInputs/TimeInput.tsx:4`). The trigger boxes are themed, but a native control's open surface, the `<select>` option list, the time spinner, is OS chrome the theme cannot style, so it breaks through a fully-designed picker. Everything else here is opinionated; a native control breaking through a designed surface is not a taste call, it reads as un-design. The Current/Recommended pair is the argument: the Recommended month opens our `MenuButton` popover and swaps the native spinner for a styled time list built from `@sanity/ui` primitives.

> **Why it matters:** an unparseable entry never reaches `onChange`. The field keeps its last valid value and flags the problem only as a native outline whose message is hidden until the author hovers it. A red field here does not mean the bad text made it into the data.

The page closes in context: the Date and Published-at datetime fields side by side on an "Anna Karenina, book launch" event being scheduled.
