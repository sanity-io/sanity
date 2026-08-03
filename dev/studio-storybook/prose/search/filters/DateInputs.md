---
source: stories/search/filters/DateInputs.stories.tsx
title: 'Search/Filter Inputs/Date'
blocks: 18
roundtrip: true
sourceHash: 4bc67b1601e41e4b
---

<!-- @component -->

Date and datetime filters are search's largest operator family, and every pair in it differs by exactly one thing: whether the emitted value carries a time component.

|          |                                                     |
| -------- | --------------------------------------------------- |
| Source   | `.../search/components/filters/filter/inputs/date/` |
| Tier     | SERVICE                                             |
| Audit    | ⚪ not-audited                                      |
| Patterns | `filters`                                           |

Three shapes exist: a single date (direction or equality), a from/to range, and a relative "in the last N units". Two of those three are doubled across a `date` and a `datetime` field type. Nine leaf components live under `inputs/date/`, but most are thin wrappers: `CommonDateDirectionInput`, `CommonDateEqualInput` and `CommonDateRangeInput` do the actual work, and each leaf file just fixes a `direction` and an `isDateTime` flag before handing off.

> **Why it matters:** every date and datetime pair here differs by exactly one thing: whether the emitted value carries a time component. The plain variant asks for a date-only string; the datetime variant asks for the same shape with the clock included. That is the organising idea of the family, not two different controls, one control asked to keep or drop the clock. The datetime inputs additionally render a switch that lets a person decide, value by value, whether this particular date is time-precise even though the field itself supports it.

The operator-to-input mapping is not one-to-one, and it is worth being exact about where it collapses: `dateNotEqual` points `inputComponent` at the exact same `SearchFilterDateEqualInput` as `dateEqual` (only the compiled `groqFilter` differs), and `dateTimeNotEqual` does the same against `SearchFilterDateTimeEqualInput`. `dateLast` and `dateTimeLast` go further still: both point at one component, `SearchFilterDateLastInput`, which has no `isDateTime` prop and no date/datetime split at all, the one member of this family that breaks the doubling pattern, because a relative "7 days ago" reads the same regardless of whether the field carries a clock.

<!-- @story DateAfterEmpty -->

The resting state of `dateAfter`. `CommonDateDirectionInput` renders `ParsedDateTextInput` above `DatePicker`; with `isDateTime={false}` fixed at the `DateAfter` wrapper, there is no include-time footer to show since a plain `date` field has no clock to carry.

<!-- @story DateAfterFilled -->

The same control carrying a value. Typed or picked, the emitted shape is `{date, includeTime?}` where `date` is a date-only ISO string (`YYYY-MM-DD`), because `DateAfter` fixes `isDateTime={false}` regardless of what the footer would otherwise do. `dateAfter`'s `groqFilter` interpolates it directly: `reviewDate > "2026-07-10"`.

<!-- @story DateBeforeFilled -->

`DateBefore` renders the exact same `CommonDateDirectionInput`, just with `direction="before"` instead of `"after"`. The only behavioural difference is which way an ambiguous calendar click rounds (`roundDay: 'start'` here vs `'end'` for after); the control on screen is identical. Pointed at `joinedAt` to show the input against a fixture field outside the article type.

<!-- @story DateTimeAfterFilled -->

`DateTimeAfter` is the same `CommonDateDirectionInput` with `isDateTime` set. With `includeTime` still `false`, `ParsedDateTextInput` formats and re-parses the value as a date only ("Jul 10, 2026") even though the stored ISO string carries a timestamp - the clock is present in the value but hidden from the control until the footer switch is flipped, shown next.

<!-- @story DateTimeAfterWithTime -->

Same field, `includeTime: true`. `isDateTimeFormat` is now true, so `ParsedDateTextInput` formats and parses full timestamps ("Jul 10, 2026 2:30 PM") and `DatePicker` renders a time selector alongside the day grid. This one prop is what separates "a datetime field where I only care about the day" from "a datetime field where the exact minute matters" - the field type does not decide that, the person building the filter does.

<!-- @story DateTimeBeforeFilled -->

`DateTimeBefore`, direction flipped. Included for completeness: like `DateBefore` above, the only change from `DateTimeAfter` is which end of an ambiguous instant a calendar click rounds to.

<!-- @story DateAfterFullscreen -->

The same `DateAfter` control inside a full-screen search. Every input in this family reads `state.fullscreen` and steps its font size up (`fontSize={fullscreen ? 2 : 1}`) on the text input, the same convention `SearchFilterStringInput` and the number family follow. The date family is easy to assume is exempt, given how much more it renders.

<!-- @story DateEqualEmpty -->

The resting state of `dateEqual` - and, since they share this exact component, `dateNotEqual` too. `CommonDateEqualInput` differs from the direction inputs in one detail: clearing the calendar selection calls `onChange(null)` outright rather than emitting `{date: null}`, since equality has no direction worth preserving once the date is gone. This is `dateEqual`'s own declared `initialValue`, `{date: null, includeTime: false}`.

<!-- @story DateEqualFilled -->

Emits `{date, includeTime}`, structurally identical to `DateAfter` filled, just without a direction. `dateEqual`'s `groqFilter` does not compare a raw timestamp for equality; it widens to `dateTime(field) > start && dateTime(field) < end` for the picked day (see the datetime variants below for where that window narrows).

<!-- @story DateTimeEqualFilled -->

`dateTimeEqual`'s `groqFilter` builds a same-day window with `startOfDay`/`endOfDay` when `includeTime` is false, so "published on July 15" matches any time that day. `dateTimeNotEqual` points `inputComponent` at this identical `SearchFilterDateTimeEqualInput` and negates the same window rather than rendering anything different.

<!-- @story DateTimeEqualWithTime -->

With `includeTime: true`, the same `groqFilter` narrows its window to `startOfMinute`/`endOfMinute` instead of the whole day. Equality becomes "within the same minute", which is the practical resolution of a calendar-plus-clock picker, not exact-to-the-millisecond.

<!-- @story DateRangeFilled -->

`dateRange`, both bounds set. `CommonDateRangeInput` renders two `ParsedDateTextInput`s (start, end) above one `DatePicker` in `selectRange` mode. Its placeholders default to today for the end bound and seven days prior for the start, so an empty range still reads as a sensible default window rather than blank boxes with no hint of scale.

<!-- @story DateTimeRangeFilled -->

`dateTimeRange` with `includeTime: false`. `getStartAndEndDate` still rounds each picked bound to a day boundary (`roundDay: 'start'` for `from`, `'end'` for `to`) even though the field is a datetime, so a calendar click on "July 25" as the end bound resolves to the last instant of that day rather than its midnight.

<!-- @story DateTimeRangeWithTime -->

Same range, `includeTime: true`. Both bounds now round to `'start'` of the picked instant rather than one rounding to the start and the other to the end of its day, and the text inputs format and parse full timestamps like the equal and direction variants above.

<!-- @story DateLast -->

`SearchFilterDateLastInput` is the one member of this family with no date/datetime split at all: `dateLast` and `dateTimeLast` both point `inputComponent` at this exact component, and it takes no `isDateTime` prop to receive. A relative window like "in the last 7 days" reads the same regardless of whether the field carries a clock, because `dateLast`'s `groqFilter` always floors to a whole day (`sub(...).toISOString().split('T')[0]`) even when the operator is `dateTimeLast`. The unit select (day/month/year) is the only structural choice this input makes; the number box beside it is a plain uncontrolled string, the same pattern the number family uses. Shown here with the value both operators declare as their default, `{unit: 'day', unitValue: 7}`.

<!-- @story DatePickerOpen -->

`DatePicker` (and the `Calendar` it wraps) is not a popover in this family: every direction, equal and range story above renders it inline, always visible, immediately below its text input - there is no trigger to "open". Isolated here on its own page because it is a substantial component in its own right: month/year navigation, a "now" shortcut, and a day grid that answers to both click and arrow-key focus, none of which is easy to see when it is sharing a frame with a text input and an EMITS readout. Click a day to move the selection.

<!-- @story IncludeTimeFooter -->

`DateIncludeTimeFooter`, isolated from the `DateTime*` inputs it normally lives inside. A controlled `Switch` plus a clickable label, both wired to the same `onChange` - the value it carries is a plain boolean. Flipping it is exactly what moves a `DateTimeEqual` / `DateTimeAfter` / `DateTimeRange` story between the "time not carried" and "time carried" variants shown earlier in this chapter; here it is shown without a date input attached, so the control can be read as what it actually is: a two-state switch, not a date control in its own right.
