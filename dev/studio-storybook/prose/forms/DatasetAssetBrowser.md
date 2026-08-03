---
source: stories/forms/DatasetAssetBrowser.stories.tsx
title: 'Q2 Board Summary Notes'
blocks: 1
roundtrip: true
sourceHash: 8a2f60799953a72d
---

<!-- @component -->

The one dialog whose entire job is telling someone before they delete something in use has a window, not an edge case, the ordinary loading window every open goes through, where the thing it is supposed to prevent is not prevented.

|          |                                                                                                                                                                                                                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/studio/assetSourceDataset/`                                                                                                                                                                                                                                                            |
| Tier     | SERVICE. The built-in asset source every Studio ships with: it lists what has already been uploaded to the dataset, alongside whatever Media Library, Unsplash or custom sources a project configures through `AssetSourceBrowser`                                                                                    |
| Audit    | 🔴 needs-work (`destructive-friction`, `spinners-loading`, `similarity`). The delete safety gate is not active for the entire window before the usage check resolves, the image thumbnail grid hardcodes the wrong asset type into its dialogs, and the image list has no visible message at all for "no images here" |
| Patterns | `destructive-friction` · `spinners-loading` · `similarity`                                                                                                                                                                                                                                                            |

`SelectAssetsDialog` (the top-level dialog opened from a file/image field's "Browse" button) fetches a page of `sanity.fileAsset` or `sanity.imageAsset` documents and hands them to `FileListView` or `ImageListView`. Each row (`AssetRow`) or thumbnail (`AssetThumb`) carries its own menu (`AssetMenu`) wired to two dialogs: `AssetUsageDialog` (read-only: which documents reference this asset) and `AssetDeleteDialog` (the same information, plus a delete action gated on it).

**What reading it turned up.**

<details><summary><b>The delete guard is not active while the check that feeds it is still running.</b></summary>

`AssetDeleteDialog`'s confirm button reads `disabled: hasResults` (AssetDeleteDialog.tsx:52), and `hasResults` comes from `publishedDocuments.length > 0` (:30-39), derived from `referringDocuments`, which starts as `[]` in `useReferringDocuments.ts`'s `INITIAL_STATE` (:15) and only becomes non-empty once the live query resolves. The dialog's `isLoading` conditional (:65-85) only swaps the body between a spinner and the confirm message; the footer, where the confirm button lives, is a separate prop to `Dialog` (`ui-components/dialog/Dialog.tsx`) that renders unconditionally. So for the entire window between the dialog opening and the usage query's first emission, and for the rest of a query that never resolves at all, the delete button is enabled, not disabled-with-a-spinner. `DeleteDialogUsageCheckPending` reproduces this with a query that never emits.

</details>

<details><summary><b>The usage-count copy is exact, and silently wrong past 101.</b></summary>

`useReferringDocuments` fetches `*[references($docId)][0...101]` and its own doc comment (:24) says so, "will only return the 101 first documents". Nothing downstream repeats that limit: `AssetUsageList`'s header interpolates an exact `{{count}}` ('{{count}} documents are using this file' / 'One document is using this file' / 'No documents are using this file', `studio.ts` i18n bundle), and neither `ConfirmMessage` nor `AssetUsageDialog` mentions truncation. An asset referenced by 150 documents reports itself as used by exactly 101, with no indication more exist, contrast `ConfirmDeleteDialog`'s equivalent cap, which at least has `OtherReferenceCount` (imperfectly) saying something was hidden.

</details>

<details><summary><b>`AssetThumb` hardcodes `assetType="file"` for both of its dialogs, even though it only ever renders images.</b></summary>

`AssetThumb.tsx:179` (`AssetUsageDialog`) and `:188` (`AssetDeleteDialog`) both pass the literal string `"file"`, `AssetThumb` is imported only by `ImageListView`, which only ever supplies `sanity.imageAsset` documents. The two i18n keys that key off `assetType` (`asset-source.asset-usage-dialog.header_file`/`_image`, `asset-source.delete-dialog.header_file`/`_image`, and the `documents-using-${assetType}` / `warning-${assetType}-is-in-use` family) all resolve to the file strings for an image: the dialog header reads "Delete file" / "Documents using file" while deleting or inspecting a photo. The toasts (`asset-source.image.asset-list.delete-failed`/`delete-successful`, AssetThumb.tsx:124,134) are correctly image-scoped, which is what makes this look like a copy-paste slip rather than a deliberate simplification, one call site was updated, the other two were not. `UsageDialogHasUsage` and `DeleteDialogInUse` reproduce the exact call `AssetThumb` makes.

</details>

<details><summary><b>`ImageListView`'s empty state renders no visible content at all.</b></summary>

`FileListView` has a loading branch (spinner, :63-69) and simply renders nothing extra when `assets.length === 0` and not loading, the column headers stay, the body underneath is blank. `ImageListView` also has a loading branch (:37-41), but its not-loading-and-empty branch (:42) is `<Text align="center" muted />`, an empty `Text` node with no children. Both list types communicate "no images/files here" purely through absence, but `ImageListView`'s dedicated empty-state element renders literally nothing, which reads as a stalled or broken page rather than a deliberate "there is nothing here" message. `EmptyAndLoadingStates` puts all four combinations side by side.

</details>

<details><summary><b>Distinguishing two similar assets is asymmetric between the two browsers.</b></summary>

`AssetRow` (file rows) renders the filename, size, formatted MIME type and a relative date inline (AssetRow.tsx:277-436), two files with a similar name are still told apart by size/type/date. `AssetThumb` (image tiles) renders exactly one `<img>` and a hover-revealed menu (AssetThumb.tsx:208-229): no filename, no size, no date, anywhere in the component. `originalFilename` reaches `AssetThumb` only as an `alt` attribute, which is not visible sighted-rendered text. Two images with the same dimensions and near-identical names (`imageInUse` / `imageLookalike` below) are indistinguishable in the grid by anything this component renders, regardless of whether the underlying pixels differ, the claim holds even where these fixtures can't show working pixels (see the fixture note below).

</details>

> **Why it matters:** the one dialog whose entire job is telling someone before they delete something in use has a window, not an edge case, where the thing it is supposed to prevent is not prevented. And the one place a person would look to tell two images apart shows them nothing to look at except the pixels themselves.

**Fixture note.** These asset URLs are shaped like real `cdn.sanity.io` paths but do not resolve, `AssetThumb` always appends `?h=<n>&fit=max` to `asset.url` (AssetThumb.tsx:204-206), which only a real image CDN can serve. Every thumbnail below renders as a broken image, the same boundary `ImageInput.stories.tsx` documents for bound image values. The surrounding chrome (menu, dialogs, hover state, the delete flow) is real and live; only the pixels are out of reach offline.
