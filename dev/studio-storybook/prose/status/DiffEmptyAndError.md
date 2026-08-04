---
source: stories/status/DiffEmptyAndError.stories.tsx
title: 'Lists & Data/Diff Empty and Error States'
blocks: 1
roundtrip: true
sourceHash: f25c32ae4d4be357
---

<!-- @component -->

The two states meaning there is nothing to show are distinguished by a card tone alone, the same colour-only pattern this program keeps finding elsewhere. And the renderer meant to catch a field type with no diff renderer appears to be defensive code with no live caller.

|          |                                                                                                                                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/field/diff/components/{NoChanges,ChangesError,ValueError,FallbackDiff,MetaInfo,ChangeBreadcrumb,Event}.tsx`                                                                                  |
| Tier     | SERVICE for the four empty/error states (each is the whole content of the Review Changes panel when it applies); CHROME for `MetaInfo`, `ChangeBreadcrumb`, and `Event` (framing around a diff, never the diff itself) |
| Audit    | 🟡 needs-work (`change-visibility`, `error-recovery`). See the findings below                                                                                                                                          |
| Patterns | `change-visibility` · `error-recovery`                                                                                                                                                                                 |

The pieces Review Changes reaches for when there is no ordinary diff to draw: the empty panel, the load-failure card, a single field whose stored value does not match its schema, the renderer a field type falls back to when none is registered for it, plus three small chrome pieces (a caption row, a breadcrumb, a timeline entry) that frame diffs elsewhere on this page and on the sibling pages.

**What reading it turned up.**

<details>
<summary><b>Put the four "not a normal diff" states side by side and judge honestly whether a person could tell which one they are looking at.</b></summary>

`NoChanges` and `ChangesError` (its default, non-revision branch) share the identical visual grammar: an `<h3>` title in `<Text size={1} weight="medium">`, then a muted paragraph underneath, nothing else. `NoChanges` sits on the bare pane background; `ChangesError` wraps the same shape in `Card tone="caution"`, a pale amber card with a matching border. That card is a real, legible differentiator in the canvas view below, but it is the only one: strip colour (screenshot in grayscale, print it, view it with a colour-vision deficiency) and the caution tone desaturates toward the same neutral the "no changes" card never had a colour to lose in the first place, two structurally identical text blocks, one now framed in a slightly darker rectangle. `ValueError` is not close to either: `Card tone="critical"` (red, not amber), a `Flex` with an `ErrorOutlineIcon`, and no `<h3>` title at all, just one paragraph beside the icon. It also appears in a completely different slot: `NoChanges`/`ChangesError` replace the whole Review Changes panel; `ValueError` replaces one field inside an otherwise-normal change list (see `FieldChange.tsx`: `{change.error ? <ValueError .../> : <DiffComponent .../>}`). `FallbackDiff` is not a message at all: it renders a real before/after value pair through `DiffFromTo`, so a person seeing it would not read it as a state, they would read it as an ordinary diff. The honest verdict: `ValueError` and `FallbackDiff` are unmistakable from the other three and from each other; `NoChanges` and `ChangesError` are the pair that could be confused at a glance, and the only thing standing between them is a card tone.

</details>

<details>
<summary><b>`FallbackDiff` does not say "no diff renderer is registered for this field type."</b></summary>

Read `FallbackDiff.tsx`: it wraps `DiffFromTo` with a `FallbackPreview` that calls the generic `<Preview schemaType value layout="default"/>`, the same component a reference or document preview uses. Nothing in its output names itself as a fallback; a person seeing it would read an ordinary before/after value pair, identical in kind to `DiffFromTo` on the `DiffFromTo` page, and would have no way to know the type-specific renderer that should be here is missing.

</details>

<details>
<summary><b>A stronger finding: `FallbackDiff` may be unreachable through the real pipeline for any schema-declared field.</b></summary>

Reading `resolveDiffComponent.ts`, `defaultComponents.ts`, and `@sanity/schema`'s `coreTypes.ts` together suggests this. `resolveDiffComponent` walks a type's `.type` chain checking `defaultComponents[name]` at each step, then falls back to `defaultComponents[originalType.jsonType]`. Every intrinsic Sanity type resolves to one of five `jsonType`s (`coreTypes.ts`), and `defaultComponents` covers every leaf case that matters: `string`/`number`/`boolean`/`date`/`datetime` directly, plus `block`/`file`/`image`/`slug`/`reference`/`crossDatasetReference` by name, and string-family types with no direct name match (`email`, `url`, `telephone`, `text`) still resolve through the final `jsonType` fallback, since they are `jsonType: 'string'`. `object`/`array` jsonTypes never need an entry at all: `buildChangeList.ts` recurses into `buildObjectChangeList`/`buildArrayChangeList` for them instead of ever constructing a leaf `FieldChangeNode`. That leaves exactly one place a real `diffComponent` becomes `undefined` on purpose: `buildChangeList.ts` line 352, `diffComponent: error ? undefined : component`, when the stored value does not match its schema type, and that is precisely the case `FieldChange.tsx` intercepts one line earlier (`change.error ? <ValueError .../> : <DiffComponent .../>`), so `DiffComponent` is never even evaluated when `diffComponent` is `undefined` for that reason either. The `FallbackDiff` story below only exists because it is mounted directly, the same "reach a branch through an impossible value" allowance the sibling pages use for their own dead branches, a `seo` diff handed to `FallbackDiff` as though `StringFieldDiff`/objects-recurse never intervened. It is evidence about the code, not about anything a person using Review Changes will ever see.

</details>

> **Why it matters:** the two states meaning there is nothing to show are distinguished by a card tone alone, the same colour-only pattern this program keeps finding elsewhere (a presence dot, a status tone). And the renderer meant to catch a field type with no diff renderer appears to be defensive code with no live caller: reassuring in one sense, since nothing is silently showing raw JSON to an editor, and a maintenance cost in another, since a whole component exists to guard a branch nothing can reach.
