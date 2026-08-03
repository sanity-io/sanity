---
source: stories/status/FileStringReferenceDiffs.stories.tsx
title: 'Author'
blocks: 1
roundtrip: true
sourceHash: 331d477475c0f2a0
---

<!-- @component -->

A reviewer comparing a before and after cannot tell a linked document that still exists but nobody titled it from one that is gone entirely: both read as Untitled. For a reference field, that distinction is the one thing Review Changes exists to preserve.

|          |                                                                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `FileFieldDiff.tsx` · `StringFieldDiff.tsx` · `ReferenceFieldDiff.tsx` (`packages/sanity/src/core/field/types/{file,string,reference}/diff/`)                                     |
| Tier     | SERVICE. Three siblings of `ImageFieldDiff` (see that page for the fourth): the leaf renderers the Review Changes dispatch chain hands a file, string, or reference field diff to |
| Audit    | 🟡 needs-work (`change-visibility`). A reference to a deleted document renders identically to a reference to an untitled one                                                      |
| Patterns | `change-visibility`                                                                                                                                                               |

Three of Review Changes' field-level renderers, one page: what changes when a file is swapped, when text is edited (or a status field is switched from a fixed list), and when a reference moves from one document to another.

Nothing here is hand-authored. `@sanity/diff` exports the same `diffInput(wrap(from), wrap(to))` the studio itself calls, so every case below supplies two plain documents and the real differ decides `action`, `fromValue`, and `toValue`. A fabricated `Diff` literal would satisfy the type and skip the only interesting part.

**What reading it turned up.**

<details>
<summary><b>File: a replacement and a first upload are distinguishable on two independent signals, and the size badge has a silent blind spot.</b></summary>

`from`/`to` (lines 57-91) are each built once and reused across three branches (96-115): removed-only wraps `from` alone in a `DiffTooltip` labelled "Removed" (`t('changes.removed-label')`, line 97); added-only wraps `to` alone labelled "Added" (line 111); a genuine replacement (`from && to`, lines 103-107) renders both `MetaInfo` cards, old filename and new filename, side by side in `FromTo` grid layout with an arrow between them, and its `DiffTooltip` passes no `description` at all, which `DiffTooltip.tsx:52` falls back to `t('changes.changed-label')`, i.e. "Changed". So a reviewer can tell them apart by shape (one card versus two-with-an-arrow) and by label ("Added"/"Removed" versus "Changed"). `getSizeDiff` has exactly one call site, `FileFieldDiff.tsx:51`, and its result gates the badge with `pctDiff !== 0` (line 80): when the guard fires there is no "0%" and no "no change" text, the badge element simply is not in the tree. `getSizeDiff` (`helpers.ts:11-20`) returns that same `0` for two different reasons: genuinely no prior size to compare (`Added`, correct), or a prior size that was a number and happened to be `0` (`!prev` is true for `0`, a bug). Both are storied below (`FileReplaced` has a badge; `FileSizeBadgeSuppressedAtZeroBytes` does not, despite an 842KB real change): a reviewer cannot tell "nothing to compare" from "the size comparison silently failed" from the row alone, the same collapse-of-distinct-causes shape as the reference finding below.

Nested subfields: `nestedFields.length > 0` (line 121) is gated independently by `didAssetChange` (line 45), exactly like `ImageFieldDiff`'s `showImageDiff` gates its own asset preview, so when only a custom subfield changes (a `caption` field added to the schema below; a bare `file` type ships no built-in meta fields the way `image` ships hotspot/crop, so this is the only door into that branch), the asset panel does not render at all, matching `ImageFieldDiff`'s identical gating. It reads correctly: nothing implies the file itself changed when it did not (`FileCaptionOnly` below). The cost is silence, not a false claim: the row shows the caption's own change with no filename anchor, because `FileFieldDiff` never renders an unchanged-asset preview for context.

</details>

<details>
<summary><b>String: the second state is any select/radio-style field, and it shows the stored value, not the configured label.</b></summary>

`options?.list` (line 15) is the only branch condition: unset, it renders `DiffString`, `@sanity/diff`'s own word-level segmentation (`field/diff/components/DiffString.tsx:78-92`), each inserted/removed run in its own `DiffCard`. Set, it renders `DiffFromTo` with `StringPreview` instead, an atomic swap, no segment diff. This is reachable by any ordinary "status"-style field, not an edge case. What reading `StringPreview` (`string/preview/StringPreview.tsx:12-20`) turned up: it renders `value` verbatim. When `options.list` entries are `{title, value}` pairs (as configured below), the field's own input shows the editor the title ("Published"); Review Changes shows the reviewer the stored value ("published"). Two different vocabularies for the same field, one screen apart.

</details>

<details>
<summary><b>Reference: always one render; the interesting question is what it resolves to.</b></summary>

`ReferenceFieldDiff.tsx:5-16` is unconditional: `DiffFromTo` in `grid` layout with `ReferencePreview`. `ReferencePreview` (`reference/preview/ReferencePreview.tsx:12-16`) hands the raw `{_ref}` straight to the shared `Preview` component, which resolves the referenced document's own preview (title, not id) through `useValuePreview` → `createPreviewObserver` (`preview/createPreviewObserver.ts:77-101`, the `isReferenceSchemaType` branch). When the id does not resolve, deleted, or simply never existed, `observeDocumentTypeFromId` returns no type, the observer falls through to `{snapshot: undefined}` (line 98), and the renderer shows the ordinary "Untitled" fallback (`DefaultPreview.tsx:133-137`, `preview.default.title-fallback` = "Untitled", `studio.ts:1504`), the exact same text a real, present, merely-untitled document would show.

</details>

> **Why it matters:** the linked document still existing but nobody titling it, and the linked document being gone entirely, both read as "Untitled". For a reference field, that distinction is the one thing Review Changes exists to preserve.
