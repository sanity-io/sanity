---
source: stories/search/filters/ReferenceAssetInputs.stories.tsx
title: 'Search/Filter Inputs/Reference and Asset'
blocks: 10
roundtrip: true
sourceHash: b600c2fd82f04ab2
---

<!-- @component -->

Reference and asset filters need a document-reference picker, and a file or image picker that hands back a pointer to an asset document rather than a content document.

|          |                                                                           |
| -------- | ------------------------------------------------------------------------- |
| Source   | `.../search/components/filters/filter/inputs/reference/` and `.../asset/` |
| Tier     | SERVICE                                                                   |
| Audit    | ⚪ not-audited                                                            |
| Patterns | `filters`                                                                 |

Both inputs share one shape: they emit `{_ref, _type}` where `_type` is the target document type (`author`, `sanity.fileAsset`, `sanity.imageAsset`), not the literal `"reference"` a document field would use. `SearchResultItem` and the asset preview components key off that `_type` to resolve a preview, so getting it right in a fixture matters.

> **Why it matters:** every other operator input in this catalog turns a keystroke or a click into a value with no help from the network, a string, a number, a boolean. These two are the exception: the reference input's autocomplete runs a real search query as you type, and the asset input opens a real asset-browsing dialog. They are the only filter inputs that do network work, and the only ones whose value depends on what a live Content Lake says exists.

<!-- @story ReferenceEmpty -->

The resting state: no reference selected, so the component renders `ReferenceAutocomplete` directly. Its placeholder already knows what it is allowed to search - "Search for Author" - because the field definition narrows the autocomplete to the `author` document type before a single character is typed.

<!-- @story ReferenceFilled -->

A bound reference to a real fixture author. The compact preview card and the "Clear" button are what replaces the autocomplete once a value exists - the two branches never render at once.

<!-- @story ReferenceAutocompleteOpen -->

Click-to-open state of the autocomplete, showing every author in the fixture dataset. The search is real: change `searchFixtures.ts`'s author list and this list changes with it.

<!-- @story AssetFileEmpty -->

No file selected. "Select" opens the real dataset asset-browsing dialog (`DatasetAssetSource`) - untested past this point in this file, since the dialog is a whole surface of its own and this chapter is about the operator input's value contract, not the asset browser.

<!-- @story AssetImageEmpty -->

No image selected - the image-typed sibling of the file story above.

<!-- @story AssetFileFilled -->

A bound file asset. The filename and size come from a real (fixture) `sanity.fileAsset` document resolved through `DocumentPreviewStore.observePaths` - the same read path production Studio uses.

<!-- @story AssetSourceErrorState -->

Not reachable through this file's harness - included so the state is documented rather than silently missing. `SearchFilterAssetInput` renders exactly this in place of the "Select" button when `assetSources.length === 0`.

<!-- @story FilePreview -->

The bare preview component. `WithReferencedAsset` resolves the reference through `observeFileAsset`, which reads `originalFilename` / `size` off the document the seeded preview store hands back - a real read, on fixture data built for this story.

<!-- @story ImagePreview -->

Both halves are real here: the document lookup resolves out of the seeded preview store, and the pixels come from an actual image served out of the storybook's static dir. It has to be a served file rather than an inlined one: `ImagePreview` builds its src as `${asset.url}?h=800&fit=max`, appending Sanity image-pipeline params unconditionally, which corrupts a `data:` URI and leaves the preview loading forever.
