---
source: stories/search/Calendar.stories.tsx
title: 'Search/Calendar'
blocks: 4
roundtrip: true
sourceHash: e5536b6875447b22
---

<!-- @component -->

Every date and datetime filter operator eventually opens the same day-grid calendar, whether inline behind a text field or standing on its own.

|          |                                                                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/datePicker/calendar/` (`Calendar.tsx`, `CalendarHeader.tsx`, `CalendarMonth.tsx`) |
| Tier     | SERVICE                                                                                                                                                                           |
| Audit    | ⚪ not-audited                                                                                                                                                                    |
| Patterns | `filters`                                                                                                                                                                         |

This page looks at the calendar on its own: the whole grid, and the two pieces it is built from, the month header and the week grid.

> **Why it matters:** the header and the month grid both call a hook that throws outside its provider rather than quietly returning nothing, so isolating either one for its own story needs a context value supplied directly, not the real calendar wrapping it. See Filter Inputs, Date Inputs, "The calendar itself", for the composed version behind a text input; this page is the calendar by itself, plus its two parts in isolation.

<!-- @story SingleDate -->

The month `focusedDate` starts on, with the starting date shown as `selected` (the filled circle-free highlight - the ring around the 25th is the separate "today" indicator, drawn only when a day is `isSameDay(date, new Date())`, and this fixture date is not today). Click a day, or use the arrow keys once focus is inside the grid, to move the selection; the readout below shows what actually reached `onSelect`.

<!-- @story HeaderOnly -->

The month/year label (from `focusedDate`, not `date` - the two diverge once someone navigates months without selecting a day) plus the "Now" shortcut and the two chevrons. Handed a fixed `CalendarContext` value and no-op handlers rather than the real `Calendar`, because `useCalendar()` throws without a provider ancestor - `moveFocusedDate` and `onNowClick` are real callback props on this component, unlike `useCalendar`'s context read.

<!-- @story MonthOnly -->

The week-day header row plus the day grid, with no navigation chrome above it - `Calendar.tsx` is the only place that pairs it with `CalendarHeader`. `WEEK_DAY_NAME_KEYS` is keyed on `firstWeekDay` (1, 6 or 7): the fixed context here uses Monday-first (1); the day cells themselves are `CalendarDay`, not separately storied on this brief.
