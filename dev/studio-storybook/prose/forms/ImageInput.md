---
source: stories/forms/ImageInput.stories.tsx
title: 'Document with an image'
blocks: 1
roundtrip: true
sourceHash: 0ddd2b8bc6377ef0
---

<!-- @component -->

The bound-image preview pixels do not render here: reaching a real CDN is the one thing offline stories cannot do, so the loading state stays up while the menu, ratio box and hotspot affordance work live around it.

|          |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | resolved via the real input resolver (`studio/inputResolver/defaultInputs.ts`): `image` → `StudioImageInput` → `BaseImageInput`                                                                                                                                                                                                                                                                                                     |
| Tier     | CORE-adjacent. The image field is engine-rendered form machinery (the FormBuilder resolves and tones it like any input), but it carries two distinct things underneath: an asset service seam (upload/browse/library, shared with `FileInput`) and a proprietary hotspot/crop editor that no design system ships. Carbon Studio filed "image input + hotspot" as a 🔴 Gap, built on tokens because there was no equivalent to reuse |
| Audit    | 🔴 needs-work (`asset-lifecycle-reuse`). As with files, the asset is authored as an in-document attachment rather than a library-first item; the hotspot/crop surface itself holds (see the ImageTool stories, which render it with real pixels)                                                                                                                                                                                    |
| Patterns | `asset-lifecycle-reuse`                                                                                                                                                                                                                                                                                                                                                                                                             |

The field for putting an image on a document, upload or browse, then crop and set a focal point, storing a reference to the managed image asset. This is where cover images, avatars and hero art get onto a document. On the surface it is the file field's sibling, the same upload/browse/library seam over an asset service, but it carries something no design system ships: a hotspot and crop editor that lets an author pin a focal point once and have every aspect ratio reframe around it.

These stories mount the real `ImageInput` through a live `FormBuilder` (`lib/formBuilderHarness.tsx`): asset sources come from `useSource().form.image`, and the bound-asset menu resolves its `sanity.imageAsset` through the fixture-backed `DocumentPreviewStore`.

Mocking boundary (read honestly): the empty, invalid, upload, read-only and error states render fully from the real component. The bound-image preview pixels do not: `ImageInput` builds a `cdn.sanity.io` URL from the asset ref via `@sanity/image-url`, which cannot resolve offline, so the preview area holds its loading state while the actions menu, ratio box and hotspot affordance render live. Real hotspot/crop pixels are in the dedicated `ImageTool` stories, which load a self-contained data-URI image.

> **Why it matters:** the bound-image preview pixels do not render here. `ImageInput` builds a CDN URL that cannot resolve offline, so the preview holds its loading state while the menu, ratio box and hotspot affordance render live. For the crop/hotspot surface with real pixels, see the ImageTool stories.

The page closes in context: the image field as the Cover image of the "Anna Karenina" book, beside its Title (bound asset, menu and ratio box live, preview pixels held offline).
