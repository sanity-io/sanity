---
source: stories/forms/ReferenceInputInternals.stories.tsx
title: 'Author'
blocks: 1
roundtrip: true
sourceHash: edefee749632b553
---

<!-- @component -->

The same three-condition footer is built by hand in two different files, and the search popover has no way to tell a genuine failure from an honest zero-match search: both collapse to the same state before they ever reach the component that renders them.

|                 |                                                                                                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source          | `packages/sanity/src/core/form/inputs/ReferenceInput/*`, plus the boundary-crossing preview halves of `CrossDatasetReferenceInput/` and `GlobalDocumentReferenceInput/`                                         |
| Tier            | SERVICE. None of these render on their own; they are the load-bearing glue `ReferenceInput`, `CrossDatasetReferenceInput` and `GlobalDocumentReferenceInput` assemble into the CORE field on the companion page |
| Audit           | 🟡 needs-work (`reference-integrity`, `error-recovery`), see the findings below                                                                                                                                 |
| Patterns        | `reference-integrity` · `error-recovery`                                                                                                                                                                        |
| Directory count | 19 non-test files in `ReferenceInput/`: 4 types/hooks, 2 already storied elsewhere, leaving 13 component files; this page stories 8 directly plus a ninth as a dependency                                       |

`Forms & Input/ReferenceInput` is the whole field. This page is a companion: the smaller parts in between it and the leaf renderer (`PreviewReferenceValue`, already its own page), the alert-strip footers, the create button, the link-card wrapper, the field's own `OptionPreview`, the width-driven autocomplete layout, and the two parts that actually reach across a dataset or project boundary.

This page stories 8 of the 13 component files directly (`AutocompleteContainer`, `CreateButton`, `OptionPreview`, `ReferenceAutocomplete`, `ReferenceLinkCard`, the three alert strips) and exercises a ninth as a direct dependency of one of those stories (`ReferencePreview`, under `OptionPreview`). `ReferenceField` is skipped: it is a generic `FormField` title/description/actions wrapper with no reference-specific branch worth a dedicated page. `ReferenceItemRefProvider` is skipped: it forwards three refs through context and renders only `props.children`, with no visual footprint of its own. `ReferenceItem` and `ReferenceInputPreview` are **not storied here**; the findings below explain why, and what reading them turned up instead.

<details><summary><b>The same footer is built three times.</b></summary>

`ReferenceItem.tsx` (lines 216-237) and `ReferenceInputPreview.tsx` (lines 132-153) each construct an identical three-condition footer (finalize-alert, strength-mismatch-alert, metadata-error-alert, same order, same components), and `ReferenceInput.tsx` folds the metadata-error case into its own inline `Alert` for the fourth, weak-reference-to-nonexistent-document case. None of the three shares the assembly. A fix to one condition is a fix to three call sites, the same shape as the already-ledgered `OptionPreview` duplication between the cross-dataset and global-document inputs.

</details>

<details><summary><b>No third branch exists in the search popover.</b></summary>

`ReferenceAutocomplete` (source, around line 57 and 88-102) computes exactly one boolean, `hasResults = options.length > 0`, and renders either the results or a "No results for ..." message. There is no `error` prop anywhere on this component. `ReferenceInput.tsx`'s `handleQueryChange` (its `catchError`) already collapses a failed search into `{hits: [], searchString, isLoading: false}`, the identical shape a legitimate zero-match search produces, before it ever reaches this component, firing a toast on the way past. So a genuine search failure and an honest "nothing matched" are the same field state, distinguishable only by a toast that has usually already disappeared by the time anyone looks back at the field. `CrossDatasetReferenceInput.tsx` does the same collapse but titles its toast with a bare English string, `'Reference search failed'`, never passed through `t()`, inconsistent with `ReferenceInput.tsx`'s translated title for the identical situation.

</details>

<details><summary><b>The boundary is crossed silently.</b></summary>

`CrossDatasetReferenceInput/PreviewReferenceValue.tsx` and `GlobalDocumentReferenceInput/PreviewReferenceValue.tsx` both receive the identifiers that name what is being reached into (`dataset`/`projectId` for one, `resourceType`/`resourceId` for the other) and forward them straight to their `*ReferencePreview`. Neither preview ever renders those identifiers as visible text: each reads them exactly once, inside a `useMemo` that only fires to build an image URL when the referenced document happens to have media (`CrossDatasetReferencePreview.tsx:66-69`, `GlobalDocumentReferencePreview.tsx:70`). Two references into two entirely different projects render pixel-identically apart from their title and subtitle, matching what ledger 119 found in the diff view, now confirmed at the field-level preview itself, in both variants.

</details>

<details><summary><b>Does anything here proceed without waiting on a check it depends on?</b></summary>

One instance exists in this subsystem, but it lives one level up and is already the audit finding on the companion page: `ReferenceInput.tsx`'s `handleCreateNew` (lines 76-131) patches the parent document and calls `onEditReference` synchronously, before any input, the "mint-and-bind" defect the companion page's Current/Recommended pair demonstrates. Nothing on _this_ page (the alert strips, `CreateButton` itself, `ReferenceLinkCard`, `AutocompleteContainer`, `ReferenceAutocomplete`) introduces a further instance; each is a plain renderer or a synchronous, fully-gated computation.

</details>
