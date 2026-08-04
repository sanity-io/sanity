---
source: stories/search/filters/StringInputs.stories.tsx
title: 'Search/Filter Inputs/String'
blocks: 5
roundtrip: true
sourceHash: ace24a8a0d38b025
---

<!-- @component -->

String-shaped filters share two value controls: a plain text input, and a list input for fields whose schema declares a fixed set of options. Together they cover a surprising share of the operator catalog.

|          |                                                       |
| -------- | ----------------------------------------------------- |
| Source   | `.../search/components/filters/filter/inputs/string/` |
| Tier     | SERVICE                                               |
| Audit    | ⚪ not-audited                                        |
| Patterns | `filters`                                             |

The same two components also serve the slug and portable text operator families, so there is no separate chapter for those: a slug match, a body match, and a title match all end at the same text input.

> **Why it matters:** every operator input implements the same three-prop contract, a field definition, a value, and a change callback, and produces a value the filter then compiles into GROQ. These stories print what each control emits, because the emitted value is the component's actual output and the rendered box is only how it asks for it.

<!-- @story StringEmpty -->

The resting state of `stringEqual`, `stringMatches`, `slugMatches`, `portableTextContains` and their negations. Emits `null` until something is typed: an empty string would be a filter for the empty string, which is a different question.

<!-- @story StringFilled -->

The same control carrying a value. Edit it and watch the emitted value follow.

<!-- @story StringFullscreen -->

The same component inside a full-screen search. It reads `state.fullscreen` and steps its font size up, which is the only difference between the two, and the pattern the other inputs follow too.

<!-- @story StringListSelected -->

The same control carrying a selection. Note what it emits: the option `value` (`in-review`), not the `title` shown in the menu ("In review"). That split is why a list field is filtered by equality rather than by matching the label a human reads.
