---
source: stories/search/common/FilterPresentation.stories.tsx
title: 'Search/Filter Presentation'
blocks: 4
roundtrip: true
sourceHash: 4995784eb87ecd2f
---

<!-- @component -->

Once a filter leaves its own popover, five small pieces are what show it: the pill on the filter bar, the label inside that pill, a plain title reused in the Add Filter menu, a shared search input, and a read-only type-count summary on a recent search.

|          |                                                                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/studio/components/navbar/search/components/common/` (`FilterTitle.tsx`, `FilterLabel.tsx`, `FilterPill.tsx`, `DocumentTypesPill.tsx`, `CustomTextInput.tsx`) |
| Tier     | SERVICE                                                                                                                                                                                |
| Audit    | ⚪ not-audited                                                                                                                                                                         |
| Patterns | `filters`                                                                                                                                                                              |

> **Why it matters:** the filter label is not one component with one layout, it is a translation string with three named slots spliced in for the field, the operator and the value, and a content flag collapses two of those slots to nothing. The filter button passes that flag only once a filter is valid, so an incomplete filter, the moment right after picking one from the menu and before a value is set, shows only the field name on purpose. Showing "Title contains" with a blank value would read as broken rather than unfinished.

<!-- @story Label -->

The sentence inside a filter pill, built from the operator's `descriptionKey` translation with `Field`, `Operator` and `Value` spliced in as React components rather than plain string interpolation - `Value` in particular renders the operator's own `buttonValueComponent` (see Filter Button Values), not a generic stringification. The fourth row is the state `FilterButton` reaches for an incomplete filter: `showContent={false}` collapses the sentence down to the bare `Field` slot, which is the honest way to say "this filter is not finished yet" rather than rendering a sentence with a hole in it.

<!-- @story Pill -->

`FilterLabel` inside a bordered, primary-tone card: the read-only shape a filter takes in a recent search entry (see Recent Search Item), as opposed to `FilterButton`, which wraps the same label in an interactive, openable control. `cursor: default` on the card is deliberate - this pill is not clickable, unlike its counterpart on the live filter bar.

<!-- @story TypesPill -->

`documentTypesTruncated` decides the string, this component just wraps it in a muted pill: `RecentSearchItem` is the one place that mounts it. The first type is always kept regardless of length (so a single long type name is never dropped entirely), the rest are added only while they still fit `availableCharacters`, and what does not fit collapses into a localized "+N more" rather than being silently cut.
