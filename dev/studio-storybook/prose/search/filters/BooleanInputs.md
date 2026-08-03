---
source: stories/search/filters/BooleanInputs.stories.tsx
title: 'Search/Filter Inputs/Boolean'
blocks: 6
roundtrip: true
sourceHash: 2cf58c048685bdf5
---

<!-- @component -->

A two-option select stands in for the switch behind every true/false filter, and it is also the shape of a genuinely different kind of operator: one that carries no value at all and so has no input to show.

|          |                                                                   |
| -------- | ----------------------------------------------------------------- |
| Source   | `.../search/components/filters/filter/inputs/boolean/Boolean.tsx` |
| Tier     | SERVICE                                                           |
| Audit    | ⚪ not-audited                                                    |
| Patterns | `filters`                                                         |

This is the value control for a boolean-equals operator; the valueless case, `defined` and `notDefined`, is the last story on this page.

> **Why it matters:** the boolean input is a controlled select, not an uncontrolled text box, so it has no empty state to speak of, it always displays either True or False. That makes it a useful contrast with the string and number families: those need to distinguish nothing typed yet from a real value, this one cannot, because a two-option select is always showing one of its two options.

<!-- @story BooleanUnset -->

What the harness passes in before any interaction: `value={null}`. The `<Select>` cannot render a null option, so it falls back to `String(value ?? true)` and displays "True" - but that fallback is a display default only, not a commit. `onChange` has not fired, so EMITS still reads `null`. In the real filter form this gap does not exist: `booleanEqual` declares `initialValue: true`, so the moment the operator is chosen the filter already carries `true` and this null state is never reachable there. It is reachable here, in the harness, because the harness starts every story from `null` regardless of the operator's own default - which is exactly what makes it worth pointing at: the component and the operator disagree slightly about what "no value" looks like, and only the emitted-value readout catches it.

<!-- @story BooleanTrue -->

The "is True" state of `featured is`. Switch it to "False" and watch EMITS follow - `handleChange` reads `event.currentTarget.value === 'true'`, so the value is a genuine boolean, not the string the DOM select actually carries.

<!-- @story BooleanFalse -->

The "is False" state, pointed at `active` on the author schema rather than `featured`, to show the same component serving an unrelated field - the input never reads anything from `fieldDefinition` beyond what `useTranslation` needs, so it behaves identically regardless of which boolean field it is attached to.

<!-- @story BooleanFullscreen -->

The same component inside a full-screen search. It reads `state.fullscreen` and steps its font size up (`fontSize={fullscreen ? 2 : 1}`), the same convention `SearchFilterStringInput` and `SearchFilterNumberInput` follow - a select gets the same treatment as a text box, which is easy to miss since a `<Select>` has no obvious "font size" until you compare it side by side with the non-fullscreen story above.

<!-- @story ValuelessOperators -->

There is no control to show here, and that absence is the point. `defined` ("not empty") and `notDefined` ("empty") are built with `defineSearchOperator` against `ValuelessSearchOperatorBuilder`, whose type pins `inputComponent`, `initialValue` and `buttonValueComponent` to `never` - not optional-and-unset, actually uninhabitable. Picking one of these operators asks a complete question by itself ("is `publishedAt` present at all?"), so there is nothing left for a value control to collect. `FilterForm.tsx` reflects that at the call site: `const Component = operator?.inputComponent`, then `{Component && <Card>...</Card>}` around the value slot - when `Component` is `undefined` that whole card is skipped, and the filter form is just the field/operator picker with no value section beneath it. This is not a rendering gap to fill; it is what "the filter is already complete" looks like in this UI.
