---
source: stories/forms/AssetPreview.stories.tsx
title: 'Forms & Input/AssetPreview'
blocks: 1
roundtrip: true
sourceHash: 271a19b32b2d5a54
---

<!-- @component -->

Inside a search filter, this small preview is the only thing telling someone which asset they narrowed to, and it cannot always say so: a reference that is still loading and one that will never resolve can render identically, and File and Image do not even agree on what identically looks like.

|          |                                                                                                                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/asset/preview/AssetPreview.tsx`                                                                |
| Tier     | SERVICE. The row that tells a person which asset a search filter is currently narrowed to, one layer inside the navbar search subsystem                                                   |
| Audit    | 🟡 needs-work (`asset-preview-loading`). "Still loading" and "the reference no longer resolves" render identically, and File and Image do not even agree on what "identically" looks like |
| Patterns | `asset-preview-loading`                                                                                                                                                                   |

Not the asset picker, the small preview shown once a search filter has a value. Given a `ReferenceValue`, it dispatches to `FileReferencePreview` or `ImageReferencePreview` by `_type` prefix, so a person filtering "images tagged like this one" or "documents referencing this PDF" can see what they picked without opening it.

**What reading the whole chain turned up.**

<details><summary><b>Four branches, two of them silent.</b></summary>

`!reference` returns `null` (:10-12); a `_type` starting with `sanity.fileAsset` routes to `FileReferencePreview` (:13-15); one starting with `sanity.imageAsset` routes to `ImageReferencePreview` (:16-18); anything else, a bound reference whose type this component does not recognise, falls through to a bare `return null` (:19). A video-asset reference (`sanity.videoAsset`, a real, shipped type, `media-library/plugin/schemas/types.ts`) takes this last branch: present, resolved, and shown as nothing.

</details>

<details><summary><b>Both type checks are prefix matches, not equality.</b></summary>

`.startsWith('sanity.fileAsset')` / `.startsWith('sanity.imageAsset')` (:13, :16) would also route a hypothetical `sanity.fileAssetVariant` or similar into the wrong branch. Not reachable with the two asset types Sanity ships today, but it is not testing what it looks like it is testing.

</details>

<details><summary><b>File and Image disagree on what "not ready yet" looks like.</b></summary>

Both delegate resolution to `WithReferencedAsset`, whose entire contract is one line: `documentId && asset ? children(asset) : waitPlaceholder` (`WithReferencedAsset.tsx:18`). `FileReferencePreview` passes `waitPlaceholder={<FileSkeleton />}` (:25), an animated card with the same icon-and-two-lines shape the resolved state has. `ImageReferencePreview` passes no `waitPlaceholder` at all (:37); the fallback is `undefined`, so the entire component renders nothing.

</details>

<details><summary><b>Neither one distinguishes loading from gone.</b></summary>

`waitPlaceholder` is the branch for both `asset` being not-yet-arrived and `asset` never arriving (a deleted or otherwise unresolvable reference resolves to the same falsy value `WithReferencedAsset` checks). A file whose asset was deleted shows the loading skeleton, permanently, with nothing to say it will never resolve. An image in the same situation shows nothing at all, indistinguishable from a filter row that has not rendered yet.

</details>

<details><summary><b>Once an image does resolve, it still cannot say so, because the image is the only thing on it.</b></summary>

`ImagePreview` (:43-53) holds a second, independent `loaded` state gating a `LoadingBlock` (:50) until the real `<img>` fires `onLoad` (:46, :51), so a resolved-but-not-yet-decoded image looks exactly like the still-fetching-metadata state above, just with a checkered box under it instead of nothing. And once it does load, there is no filename, no label, nothing but the picture (:48-53); contrast `FilePreview`, which shows filename and size as text (`FileReferencePreview.tsx:38-49`) independent of any thumbnail.

</details>

> **Why it matters:** two similar-looking images are distinguishable only by their pixels, there is no filename or label to fall back on, and if those pixels have not loaded, or never will because the reference is broken, the row gives no sign of which case it is. File is more honest about being stuck, at the cost of a skeleton that never stops promising to finish.
