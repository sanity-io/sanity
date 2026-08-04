---
source: stories/search/filters/NumberInputs.stories.tsx
title: 'Search/Filter Inputs/Number'
blocks: 6
roundtrip: true
sourceHash: 546a9c9bcfd6b4d8
---

<!-- @component -->

Number-shaped filters share two value controls: a single numeric box for the comparison operators, and a two-box range input for is-between. The same pair also serves the array-count family, since counting items in an array collapses to the same comparisons once the field resolves to a number.

|          |                                                       |
| -------- | ----------------------------------------------------- |
| Source   | `.../search/components/filters/filter/inputs/number/` |
| Tier     | SERVICE                                               |
| Audit    | ⚪ not-audited                                        |
| Patterns | `filters`                                             |

> **Why it matters:** both inputs are uncontrolled, each keeps its own raw string in local state so the box can hold an empty string, a bare minus sign, or a trailing decimal point mid-keystroke, and only calls back with a finite number or nothing. The range input takes that a step further: its two bounds are independent state, so one bound can be typed while the other sits untouched, and each keystroke reads the other bound off the last-committed value rather than the sibling input's local state.

<!-- @story NumberEmpty -->

The resting state of `numberEqual`, `numberGt`, `numberGte`, `numberLt`, `numberLte` and `numberNotEqual`. Emits `null` until a finite number is typed - `parseFloat` on an empty or partial string (`""`, `"-"`) is `NaN`, which the component treats the same as no value rather than passing `NaN` downstream into a GROQ filter.

<!-- @story NumberFilled -->

The same control carrying a value. Edit it and watch the emitted value follow - note it tracks the field as a bare number (`8`, not `"8"`), which is what lets `numberGt`'s `groqFilter` interpolate it directly into `readingTime > 8` without a cast.

<!-- @story NumberFullscreen -->

The same component inside a full-screen search. It reads `state.fullscreen` and steps its font size up (`fontSize={fullscreen ? 2 : 1}`), the same convention `SearchFilterStringInput` follows. It is easy to assume only the string family does this.

<!-- @story NumberRangeEmpty -->

The resting state of `numberRange`. Both bounds start at `""` in local state; the operator emits `null` until it has a `value` at all, and its `groqFilter` only produces a filter once both `from` and `to` are finite - a range with one bound set is a real, reachable UI state that still does not compile into a query. See "partially filled" below.

<!-- @story NumberRangePartial -->

One bound set, the other left at `null`. This is not a hypothetical edge case - `handleFromChange` and `handleToChange` each write their own key of the value object independently and default the other to `value?.to ?? null` / `value?.from ?? null`, so a user who fills in only "from" produces exactly this shape. `numberRange`'s `groqFilter` returns `''` (not `null`) for it, which shows up if you are inspecting emitted filter strings rather than the value object.
