---
source: stories/forms/FileInput.stories.tsx
title: 'Document with a file'
blocks: 1
roundtrip: true
sourceHash: ae81f341a53963a7
---

<!-- @component -->

A file is authored as an attachment trapped in this document, not a first-class library item with its own identity and cross-document usage: the field shows a filename and a size, not where else the asset lives or what breaks if it is removed here.

|          |                                                                                                                                                                                                                                                                                                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | resolved via the real input resolver (`studio/inputResolver/defaultInputs.ts`): `file` → `StudioFileInput` → `BaseFileInput`                                                                                                                                                                                                                                                |
| Tier     | SERVICE. The file field is a thin seam over an asset service (upload, browse, dataset/library). Sanity has already extracted Media Library as a separate app, which is exactly the decomposition boundary this input sits on: it owns a drop-target and a menu, and delegates identity/storage to a service behind a narrow interface (a reference to a `sanity.fileAsset`) |
| Audit    | 🔴 needs-work (`asset-lifecycle-reuse`). The asset is authored as an attachment trapped in this document rather than a first-class library item with its own identity, metadata and cross-document usage; the field surfaces a filename and a size, not the asset's lifecycle                                                                                               |
| Patterns | `asset-lifecycle-reuse`                                                                                                                                                                                                                                                                                                                                                     |

The field for attaching a file, a PDF, a zip, any binary, to a document: drop or browse to upload, and it stores a reference to the managed asset. Whenever a document needs a file hanging off it, a spec sheet, a press kit, a download, this is the field. It is deliberately thin: it owns a drop-target and a small actions menu, and hands everything about storage and identity to an asset service behind a narrow interface (a reference to a `sanity.fileAsset`). That seam is exactly the line Sanity drew when it extracted Media Library into its own app.

These stories mount the real `FileInput` through a live `FormBuilder` (`lib/formBuilderHarness.tsx`): `file` resolves to `StudioFileInput` through `BaseFileInput` via the real input resolver, asset sources come from the workspace's form config (`useSource().form.file`), and the bound-asset preview resolves its `sanity.fileAsset` through the fixture-backed `DocumentPreviewStore` (`observeFileAsset` through `observePaths`). The file card, filename, size, extension, actions menu, needs no pixels, so it renders fully offline.

Mocking boundary: there is no asset backend, so the empty and mid-upload states render the pre-upload affordances honestly; the actual upload network round-trip is not exercised. The inputs call `useAssetLimitsUpsellContext()` at render, so the subtree is wrapped in an inert upsell provider (it never opens).

> **Why it matters:** the file is authored as an attachment trapped in this document, not a first-class library item with its own identity and cross-document usage. The field shows a filename and a size, not where else the asset lives, or what breaks if it is removed here.

The page closes in context: the file field as the Press kit of the "Anna Karenina" book, beside its Title, with a bound PDF asset resolved for real.
