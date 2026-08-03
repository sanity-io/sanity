---
source: stories/search/filters/FilterEditor.stories.tsx
title: 'Search/Filter Editor'
blocks: 6
roundtrip: true
sourceHash: e9b2792762819617
---

<!-- @component -->

The filter bar's one interactive control runs end to end here: the pill a person clicks, the popover it opens, the operator picker and value form inside, and the fallback if that form ever crashes.

|          |                                                                                                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source   | `packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/` (`FilterButton.tsx`, `FilterPopoverContent.tsx`, `FilterForm.tsx`, `OperatorsMenuButton.tsx`, `FilterError.tsx`) |
| Tier     | SERVICE                                                                                                                                                                                                |
| Audit    | ⚪ not-audited                                                                                                                                                                                         |
| Patterns | `filters`                                                                                                                                                                                              |

`FilterButton` is the closed pill; `FilterPopoverContent` and `FilterForm` are what opens inside it; `OperatorsMenuButton` is the "contains" control that switches operators without leaving the form; `FilterError` is what replaces all of it if the operator's own input component throws. See `FilterForm.tsx:62-68` for where the catch happens, above the focus lock and below everything else on the page.

> **Why it matters:** the value form wraps itself in its own error boundary, scoped to just that one form. A crash inside a single filter's operator input degrades to the fallback for that one pill; the rest of the filter bar, the query field, and every other open filter keep working. That is a real design decision, not incidental plumbing.

<!-- @story ButtonWithValue -->

A closed pill for `title contains "release"`, `tone="primary"` on both the label card and its separate close button because `validateFilter` finds a real value. Clicking it (canvas view) opens the popover this page's other stories show individually.

<!-- @story ButtonIncomplete -->

No value yet, so `validateFilter` returns false: the pill drops to `tone="transparent"` and its label shows only the field name (see `FilterLabel`'s `showContent={isValid}`). `initialOpen` reproduces the moment right after picking a filter from the Add Filter menu, when the form is already open waiting for a value.

<!-- @story FormBooleanField -->

The value editor (`Component`, from `operator.inputComponent`) stacks above the title/description/operator row in DOM order, deliberately reversed with `direction="column-reverse"` so the value input is first in the focus order - the comment in `FilterForm.tsx:66` calls this out as intentional, not an accident of flex layout. Boolean has no `filterDefinition.description`, so that card does not appear here; compare against the reference field below, which has one.

<!-- @story ErrorFallback -->

`FilterForm.tsx:62-64` swaps to exactly this component the moment its `ErrorBoundary` catches: `if (errorParams) return <FilterError padding={4} />`. Shown here as the standalone renderer it is (an icon, a title, a description, all critical-toned) rather than staged by forcing an operator input to throw - the wiring is a two-line citation, checkable by reading the source at that line, not a claim about which input crashes or when.

<!-- @story OperatorsMenu -->

`title` is a `string` filter, one of the definitions with the most operators - contains, does not contain, is, is not, not empty, empty - separated by dividers into three groups. Opened here (canvas view) to show `pressed` on the current selection, the same treatment a selected menu item gets everywhere else in the studio.
