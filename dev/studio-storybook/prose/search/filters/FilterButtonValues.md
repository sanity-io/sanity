---
source: stories/search/filters/FilterButtonValues.stories.tsx
title: 'Search/Filter Button Values'
blocks: 6
roundtrip: true
sourceHash: 3b34264e713b2b3f
---

<!-- @component -->

An active filter shows a short, read-only summary in its own pill and label: a date, a range, a relative window, a resolved document title. Four small renderers, one per value shape, cover the whole set.

|          |                                                                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/studio/components/navbar/search/components/filters/common/ButtonValue.tsx` (all four exports), `.../ReferencePreviewTitle.tsx` |
| Tier     | SERVICE                                                                                                                                                  |
| Audit    | ⚪ not-audited                                                                                                                                           |
| Patterns | `filters`                                                                                                                                                |

The filter label, see Filter Chrome, is the only place any of these actually mount; this page pins the four value shapes on their own.

> **Why it matters:** every one of these has a null branch, and the null branch renders nothing at all, not a placeholder. Two return nothing for an invalid or incomplete value, and the reference renderer returns nothing for a document type the fixture schema does not know. A filter pill showing blank space instead of a value is easy to misread as no filter at all, when the truth is a value the button cannot render.

<!-- @story DateValue -->

Backs `dateAfter`, `dateBefore`, `dateEqual` and `dateNotEqual`, and their datetime siblings - every operator whose value is a single point in time. `date-fns/isValid` gates the render: an unset or malformed `date` produces `null`, shown here as the third row, which is genuinely empty, not a dash or a placeholder string.

<!-- @story DateRangeValue -->

Backs `dateRange` and `dateTimeRange`. Both ends of the range are required for anything to render at all - the component checks `!endDate || !startDate` before formatting either one, so a range with only a start date (the state the two-step range picker sits in between selecting its first and second day) shows nothing rather than a half-built "Jul 1 → ".

<!-- @story DateLastValue -->

Backs `dateLast` ("in the last N days/months/years", the only relative-date operator). Unlike its two siblings above it has no null branch: `Math.floor(value?.unitValue ?? 0)` always produces a number, so an empty operator input would render as "0 days" rather than nothing. `useUnitFormatter` supplies the pluralisation, so '1 year' above does not read '1 years'.

<!-- @story ReferenceValue -->

Backs `referenceEqual`, `referenceNotEqual` and the asset-reference operators. The `_type` on this value is the referenced document's own type ("author"), not the literal string "reference" a raw `Reference` object usually carries - `ReferenceAutocomplete.handleSelect` sets it from `hit._type` when the value is chosen, and `schema.get(value._type)` here depends on that. `schema.get` returning nothing (second row) is the guard against a stale filter pointing at a type that no longer exists in the workspace.

<!-- @story ReferencePreviewTitleStory -->

What `SearchButtonValueReference` mounts once a schema type resolves: a live subscription to `getPreviewStateObservable`, rendering a skeleton while `isLoading`, then `snapshot?.title || original?.title`. The fallback matters for the second row - a reference to a document the preview store cannot find still needs to show _something_, and what it shows is the first eight characters of the raw id rather than a blank space or an error.
