---
source: stories/forms/ImageTool.stories.tsx
title: 'Document with an image'
blocks: 1
roundtrip: true
sourceHash: 4d6b8895675bde8d
---

<!-- @component -->

An author drops a focal point on an image and pulls in a crop, and from that single act every size the front end asks for reframes around the point that matters instead of blindly centre-cropping.

|          |                                                                                                                                                                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/files/ImageToolInput/` (`imagetool` for the pure SVG editor, `ImageToolInput.tsx` for the full field)                                                                                                                                                                                     |
| Tier     | CORE-adjacent. The crop + hotspot editor is Studio's proprietary invention: no design system ships a coordinate editor that lets an author pin a focal point and an inset crop and previews the result across arbitrary aspect ratios. Carbon Studio filed it as a 🔴 Gap, "built" on tokens because there was nothing to reuse |
| Audit    | 🟢 holds. This is a differentiation surface, not one of the 75 needs-work defects; it is exactly the kind of component a commodity design system cannot teach, so a real-code catalog most needs it documented                                                                                                                  |
| Patterns | `asset-lifecycle-reuse`                                                                                                                                                                                                                                                                                                         |

Studio's crop-and-hotspot editor: drag a focal point onto an image and inset a crop, and every aspect ratio reframes around it. This is one of the most distinctive things Studio builds, and one of the most satisfying to demo. From a single pinned point, every size the front end asks for, a square thumbnail, a 16:9 hero, a tall portrait, reframes around the point that matters instead of blindly centre-cropping. No commodity design system ships a coordinate editor like this. Carbon Studio filed it as a Gap built from tokens.

Unlike the `ImageInput` preview (which needs the CDN), these stories load a self-contained SVG data-URI (`lib/mockAssetFixtures.ts`), so the editor and its aspect-ratio previews render with real pixels, fully offline. `ImageTool` takes a plain `src` and mounts with zero providers; `ImageToolInput` is the full titled field (checkered canvas plus the 3:4 / Square / 16:9 / Panorama previews that recompute live as you drag the hotspot).

Interactions are real: drag the round hotspot to move the focal point, drag the crop handles to inset the frame. The JSON below the pure editor updates from the component's own `onChange`/`onChangeEnd`, and the field's previews reframe from the same `HotspotImage` pipeline Studio ships.

> **Why it matters:** `ImageTool` is the pure SVG editor and mounts with zero providers, a plain source and a value is all it needs. `ImageToolInput` is the full titled field that adds the live aspect-ratio previews. Reach for the former when the editing surface alone is enough, the latter to show why the hotspot matters.

The page closes in context: the full `ImageToolInput` field as the Cover image of the "Anna Karenina" book, focal point and crop set the way an editor would.
