---
source: stories/status/ImageFieldDiff.stories.tsx
title: 'Article'
blocks: 1
roundtrip: true
sourceHash: 48ac4bc09a60c5cc
---

<!-- @component -->

A dead branch here is lower-stakes than the ChangeResolver and MemberField instances of the same shape: it never withholds information from anyone, it just ships an unreachable translation into every locale. The finding is filed for completeness, not urgency.

|          |                                                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/field/types/image/diff/ImageFieldDiff.tsx`                                                                         |
| Tier     | SERVICE. The Review Changes renderer for every image field, one level below `FieldChange` in the dispatch chain this series has been tracing |
| Audit    | 🟡 needs-work (`change-visibility`). One translated string is shipped to every locale for a branch that cannot run                           |
| Patterns | `change-visibility`                                                                                                                          |

What Review Changes draws for an image field: the asset before/after, an added/removed/changed label, and (separately) any crop/hotspot or custom-subfield change underneath it.

**Mocking boundary (read honestly), matching `Forms & Input/ImageInput`'s own note for the same reason.** `ImagePreview` (the sub-component every branch below routes into) builds its `<img src>` by calling `createImageUrlBuilder(client).image(id)...`, an algorithmic `cdn.sanity.io` URL built from the asset id and the client's project/dataset, not a read of the asset document's own `url` field. That is a different, harder boundary than `static/fixture-cover.svg` solves (that fixture serves a component whose `src` is `asset.url` directly). So in every story below: the asset document resolves offline through the seeded preview store, title, "deleted" detection, and the added/removed/changed dispatch all come from that and are genuinely verified, but the pixel request cannot resolve in this environment. Depending on how the runtime handles the failed request, the image area either holds mid-load or (this component, unlike `ImageInput`'s preview, has an explicit `onError` handler) falls through to its own "Error loading image" text. Either is the honest, real behaviour of a request that cannot complete offline, not a broken story.

**What reading it turned up.**

<details>
<summary><b>The confirmed finding: `!from && !to` cannot be reached.</b></summary>

`from` and `to` (lines ~56-85) are ternary expressions, and both arms of each ternary return a JSX element, `<DiffCard><ImagePreview /></DiffCard>` on one side, `<NoImagePreview />` on the other. A JSX element is always a truthy object; there is no arm of either ternary that can produce `undefined`, `null`, or `false`. So `if (!from && !to)` (line 87) can never be true, and `t('changes.image.no-asset-set')`, defined once, at `core/i18n/bundles/studio.ts:375` (`"Image not set"`), referenced nowhere else in the codebase, is a translated string in every locale bundle that cannot appear on screen. Independently verified by reading the file: this is correct.

</details>

<details>
<summary><b>The two real "nothing to compare" states already have their own renderers, which is presumably why the guard was never exercised into existence.</b></summary>

An added image (no `fromRef`) already shows `<NoImagePreview />` on the from side inside the normal `FromTo` layout; a document with no cover at all simply never reaches this component (no field, no diff, no dispatch). The unreachable branch would only have fired for a third situation, both sides genuinely empty and `isChanged` true, which the ternaries themselves rule out from ever producing.

</details>

<details>
<summary><b>The nested-changes path is not the crop/hotspot path.</b></summary>

`nestedFields` (line ~36-40) filters `schemaType.fields` to names outside `BASE_IMAGE_FIELDS` (`asset`, `media`, `crop`, `hotspot`), i.e. a custom subfield someone added to the image type, like `alt`. Crop and hotspot changes never reach the nested `<ChangeList>`; they are drawn inside `ImagePreview` itself via `<HotspotCropSVG>`, gated by `showMetaChange`/`didHotspotChange`/`didCropChange`. Two different mechanisms for two different kinds of "something else about this image changed", easy to conflate from the outside. `MetadataChanged` and `SubfieldChanged` below are deliberately separate stories for this reason.

</details>

> **Why it matters:** filed as the same pattern for completeness, not urgency: a dead branch never withholds information from anyone here, but it is the same guard-for-a-state-that-cannot-occur shape this series keeps finding elsewhere, where the stakes are higher.
