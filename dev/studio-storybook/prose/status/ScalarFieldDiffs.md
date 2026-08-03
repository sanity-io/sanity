---
source: stories/status/ScalarFieldDiffs.stories.tsx
title: 'Custom date'
blocks: 1
roundtrip: true
sourceHash: 7baab590930724f2
---

<!-- @component -->

Across six renderers, the same shape recurs: a value that genuinely differs from what the renderer assumes gets drawn as if it were the ordinary case, silently. Two of those are live, confirmed bugs: a spurious time appended to a date-only field, and a deleted reference that reads as merely untitled.

|          |                                                                                                                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `BooleanFieldDiff.tsx` · `DatetimeFieldDiff.tsx` · `NumberFieldDiff.tsx` · `SlugFieldDiff.tsx` · `ReferenceFieldDiff.tsx` · `defaultComponents.ts` / `resolveDiffComponent.ts` (which renderer serves which type)                      |
| Tier     | SERVICE. One level below `FieldChange` in the dispatch chain `Lists & Data/ChangeResolver` traces. Each is what Review Changes draws for one field type, or, for two of these six, for two field types at once                         |
| Audit    | 🔴 needs-work (`change-visibility`). Two live, confirmed rendering bugs (a spurious time on a date-only field; a deleted reference reading as an untitled one) plus the boolean label/glyph findings already filed as ledger #104/#105 |
| Patterns | `change-visibility`                                                                                                                                                                                                                    |

Six small renderers for the field kinds a lot of schemas lean on: a toggle, a date, a count, a URL segment, and a same-dataset or cross-dataset pointer to another document.

Nothing here is hand-authored. `@sanity/diff` exports the same `diffInput(wrap(from), wrap(to))` the studio itself calls, so each story supplies two plain documents and the real differ decides `action`, `fromValue`, and `toValue`.

**What reading it turned up.**

<details>
<summary><b>Boolean is the only one of these with its own layout, and direction is visible.</b></summary>

`BooleanFieldDiff` (lines 15-42) renders `<Preview checked={fromValue} />`, a `FromToArrow`, then `<Preview checked={toValue} />` side by side (lines 19-29), both `Checkbox` and `Switch` (`boolean/preview/BooleanPreview.tsx`) fill or position differently for `true` versus `false` (`fill={checked ? color?.border : color?.background}`), so a true-to-false flip and a false-to-true flip are visibly mirror images, not an unlabelled 'this changed'.

</details>

<details>
<summary><b>Boolean drops its own label on the one outcome that most needs it, and no outer wrapper covers for it (ledger #104).</b></summary>

`{showToValue && title && <Text>{title}</Text>}` (line 34) gates the label on `toValue !== undefined && toValue !== null` alone, so a cleared boolean renders an unlabelled checkbox or switch. `boolean` is also the only entry in `defaultComponents.ts` carrying `showHeader: false` (`defaultComponents.ts:17`), which suppresses the shared `ChangeBreadcrumb` header every other type gets by default (`buildChangeList.ts:333-336`), so for booleans specifically, nothing else in the row labels it either.

</details>

<details>
<summary><b>Boolean's "from" side is gated on a document-level flag, not on whether this field actually had a value (ledger #105).</b></summary>

`{showFromValue && <Preview checked={fromValue} .../>}` (line 19) reads `showFromValue` from `useDocumentChange()`, a per-document flag, not `diff.fromValue !== undefined`, which is the guard `DiffFromTo` uses for the same purpose (`DiffFromTo.tsx` line 51). A boolean field added inside a document that already existed gets `Preview checked={undefined}`, the indeterminate dash/centred-knob glyph (`BooleanPreview.tsx` lines 28-29, 40-41), meant for "genuinely optional and unset," rendered instead for "there was nothing to show." `BooleanFieldAdded` and `BooleanNewDocument` are the same diff with only the flag flipped.

</details>

<details>
<summary><b>Datetime and Number are bare delegates to `DiffFromTo`.</b></summary>

`DatetimePreview` calls `legacyDateFormat.format(new Date(value), dateFormat + ' ' + timeFormat)` (`datetime/preview/DatetimePreview.tsx` lines 24-32), defaulting to `'YYYY-MM-DD'` + `'HH:mm'`, an absolute calendar timestamp, never a relative phrase. `NumberPreview` just prints `{value}`, typed `FieldPreviewComponent<string>` even though `NumberDiff`'s values are `number` (`@sanity/diff/src/types.ts:243`), a wrong annotation, not a behavioural bug.

</details>

<details>
<summary><b>Slug is also a bare delegate, over `SlugPreview`, and it never sees the title that produced it.</b></summary>

`SlugFieldDiff` receives exactly `diff.fields.slug`; nothing hands it `diff.fields.title`. `SlugFollowsTitleChange` runs both through the real `ChangeList` and shows two independent rows, not one.

</details>

<details>
<summary><b>The date/datetime split works correctly for the case every schema actually writes.</b></summary>

`defaultComponents.ts` maps both `date` and `datetime` to `DatetimeFieldDiff` (lines 18-19). `resolveDiffComponent` (`resolveDiffComponent.ts` lines 15-26) walks the type chain and, for an ordinary inline `{type: 'date'}` field, matches `defaultComponents['date']` directly, the field's own `schemaType.name` really is `'date'`. `formatDateTime` (`DatetimePreview.tsx` line 31) checks exactly that name and skips the time format. `DateChanged` confirms it: a clean, date-only render, no `00:00`.

</details>

<details>
<summary><b>The same check breaks the moment a schema names its own date type, and this is a real, live bug, not a theoretical one.</b></summary>

`resolveDiffComponent`'s chain-walk (lines 15-26) correctly finds `DatetimeFieldDiff` no matter how many named types sit between a field and `date`, it walks `itType.type` until `defaultComponents[itType.name]` matches. But the `schemaType` prop the resolved component actually receives is never updated to reflect that walk: `buildChangeList.ts`'s `getFieldChange` (lines 300-350) keeps the field's own leaf type, sourced from `buildObjectChangeList`'s `field.type` (line 103), all the way through. So `defineType({name: 'customDate', type: 'date'})`, an ordinary, common pattern for sharing a date field's config across several document types, gets the correct component (`DatetimeFieldDiff`, found by the walk) but the wrong name reaching `formatDateTime`'s check: `schemaType.name` is `'customDate'`, not `'date'`, the `name === 'date'` guard is false, and it falls into the branch that appends the time format. `new Date('2026-07-20')` parses as midnight UTC, so the panel shows a real, wrong-looking time on a field the schema declares has none. `DateViaCustomNamedType` reproduces this exactly.

</details>

<details>
<summary><b>Reference and crossDatasetReference render identically, and nothing communicates the boundary a crossDatasetReference actually crosses.</b></summary>

Both map to `ReferenceFieldDiff` (`defaultComponents.ts` lines 23-24), which delegates to `DiffFromTo` with `ReferencePreview`, the referenced document's own preview, nothing else (`ReferencePreview.tsx` lines 12-16). A `CrossDatasetReferenceValue` carries `_dataset`/`_projectId` (`@sanity/types/src/crossDatasetReference/types.ts` lines 9-16) specifically because the referenced document lives in a different project and dataset, and `createPreviewObserver.ts` (lines 52-76) does route the actual fetch through those fields, but the snapshot that comes back is rendered through the exact same title/media preview as a same-dataset reference, so `_dataset`/`_projectId` are consumed once, to pick an API, and then discarded. `ReferenceChanged` and `CrossDatasetReferenceChanged` below point at the same two fixture documents through the same two ids, changing only the reference type, and render pixel-identically.

</details>

<details>
<summary><b>A reference to a document deleted between edit and review shows neither the id nor an error: it shows the word "Untitled," indistinguishable from a real document with no title.</b></summary>

Traced the whole chain: `ReferencePreview` (`ReferencePreview.tsx:12-16`) hands the reference value to the generic `<Preview layout="default">`, which resolves through `useValuePreview` (`preview/useValuePreview.ts:89`: `value: event.snapshot || undefined`). `createPreviewObserver.ts` (lines 86-99) resolves a reference by first looking up the target's `_type` via `observeDocumentTypeFromId`; when the id no longer exists that lookup returns nothing and the observer falls through to `of({snapshot: undefined})`, no thrown error, just an empty snapshot. `PreviewLoader` then spreads `preview?.value || {}` (empty) into the preview component with `error={preview?.error}` (`undefined`) and `isPlaceholder={preview?.isLoading}` (`false`), so `DefaultPreview` (`components/previews/general/DefaultPreview.tsx` lines 130-137) takes its own `{!title && <span>{t('preview.default.title-fallback')}</span>}` branch: the literal string "Untitled." `value._ref`, the one piece of information that would tell a reviewer which document is missing, is never read by any component in this chain. Same path for `crossDatasetReference`: `createPreviewObserver.ts` lines 61-75 fall through to the identical `of({snapshot: undefined})` when the cross-dataset lookup fails. `ReferenceToDeletedDocument` reproduces this with `author-mercer`, a plausible id deliberately never seeded into the fixture store.

</details>

> **Why it matters:** several of these findings share a shape: a value that genuinely differs from the renderer's assumed case gets drawn as if it were the common one, silently. The custom-named date type is the most serious of them, reachable by any schema that names a reusable date type, a common pattern, and it produces a visibly wrong timestamp with no error, warning, or fallback. The deleted reference is close behind: a broken reference and an untitled-but-real one are visually identical, and the id that would resolve the ambiguity is discarded earlier in the chain. The cross-dataset reference finding is different in kind, not a bug so much as an absent signal, worth a decision rather than necessarily a defect to fix.
