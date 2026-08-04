---
source: stories/customisation/DocumentBadges.stories.tsx
title: 'This document has unpublished changes'
blocks: 6
roundtrip: true
sourceHash: d0155caefba141aa
---

<!-- @component -->

A badge is a function that receives a document's edit state and returns a description or `null`; Studio renders it: the status pills beside a document title, Draft, Published, and whatever else a studio wants to say about a document at a glance.

|          |                                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| Seam     | `document.badges`, the second of the chapter’s two description seams, sibling of `Customisation/Document Actions` |
| Tier     | SERVICE                                                                                                           |
| Patterns | `draft-publish-lifecycle`                                                                                         |

There is no `renderDefault`, because there is no markup to delegate to, and the equivalent of decoration is to call the badge you are extending and spread its description.

The same badge has to render in the status bar, and it has to stay legible at a size the studio controls rather than the author. Handing back a description lets Studio place it consistently and lets the four colour names map to whatever tones the current theme resolves to. `DocumentBadges.tsx` holds that mapping, and it is a translation rather than a pass-through:

```ts
primary -> 'primary'   success -> 'positive'
warning -> 'caution'   danger  -> 'critical'
```

Four colours, and that is the whole vocabulary. `DocumentBadgeDescription.color` is typed `'primary' | 'success' | 'warning' | 'danger'`. There is no arbitrary colour and no icon slot in the rendered output despite `icon` being on the type, because `DocumentBadgesInner` renders only `label` inside a `<Badge>` and `title` as its tooltip. A badge that sets an icon is setting a field nothing reads.

> **Why it matters:** returning `null` is the normal case, not the error case. Most badges are conditional, the Draft badge exists only when a draft does, and story 4 shows a badge declining, which renders nothing at all rather than an empty pill.

<!-- @story Default -->

Two badges against a document that has both a draft and a published version, so both return a description rather than `null`.

Hover either one: `title` becomes the tooltip and `label` is the pill. That split is the presentation contract, and it is why a badge cannot say much. The design intent is a glanceable state marker rather than a place to put information.

<!-- @story Extended -->

The Draft badge replaced by one that calls it, spreads the result, and overrides `label` and `color`. The `title` survives untouched because it was spread rather than restated.

This is the description-seam equivalent of `renderDefault`, and the difference is explicit: **with `renderDefault` you cannot accidentally drop a field, and here you can.** A decoration written as `{label: "Draft (needs review)", color: "danger"}` rather than `{...original, …}` silently discards the tooltip. Nothing warns, and the badge still looks correct.

<!-- @story Added -->

A third badge appended to the built-ins, which is what most real customisation of this seam looks like. Adding is far more common than replacing here, because the built-in badges describe a lifecycle the studio owns and a custom one usually describes something the business owns.

The order is the array order. `document.badges` is a reducer over the config tree, so a plugin appending a badge lands after the ones already registered unless it rewrites the array it was handed.

<!-- @story Declining -->

The first badge returns `null` and the second does not. One pill renders, and there is no gap, placeholder or spacing artefact where the first would have been.

Storied because conditional badges are the majority and the `null` path is the one most easily left untested. `DocumentBadgesInner` also short-circuits on an empty array and returns `null` for the whole group, so a document where every badge declines contributes no layout at all rather than an empty row.

<!-- @story NoBadges -->

An empty badge array. The group renders nothing.

Pinned deliberately: `DocumentBadges` returns `null` when `badges` is falsy **or** when `editState` is, and the empty-array case falls through to `DocumentBadgesInner`, which has its own `states.length === 0` guard. Three separate paths reach the same empty result, so a badge that is not appearing has three places to check.

The `Code` block below prints what the stub supplied, so the story states its own input rather than leaving an empty frame to be interpreted.
