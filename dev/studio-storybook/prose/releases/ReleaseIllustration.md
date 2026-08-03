---
source: stories/releases/ReleaseIllustration.stories.tsx
title: 'Releases/Release Illustration'
blocks: 4
roundtrip: true
sourceHash: d05aa2bac80b05d9
---

<!-- @component -->

This illustration is a participant in the theme rather than a picture pasted on top of it: drop it inside a caution-toned card and it picks up the caution palette, because it reads the same custom properties the card sets.

|        |                                                                            |
| ------ | -------------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/releases/tool/resources/ReleaseIllustration.tsx` |
| Tier   | CHROME                                                                     |

The drawing at the top of every empty Releases screen: stacked, receding panels standing in for a set of documents moving together. An inline SVG with no props. It appears in three places: the releases empty state, the scheduled-drafts empty state, and both halves of the schedules upsell.

The stacked-panel motif is reused (not shared) by `VariantIllustration`, which draws the same idea for a different primitive.

> **Why it matters:** the fills and strokes are theme custom properties, not hex values, so the illustration is theme-aware and tone-aware in the same move. That is why an empty state can restyle itself for an upsell without shipping a second file.

<!-- @story Default -->

At its natural 248x201. Toggle the storybook theme and watch it follow: nothing about the markup changes, only the custom properties it reads.

<!-- @story AcrossTones -->

The same component in five differently-toned cards. Nothing is passed to it - each Card sets `--card-muted-*` for its subtree and the SVG reads whatever it finds. This is why the schedules upsell can render it inside a promotional panel and have it look designed for that panel.

<!-- @story InContext -->

The composition it was drawn for: illustration, a heading, a sentence, and the one action worth taking. The illustration is carrying tone rather than information here - it makes an empty screen read as "nothing yet" instead of "something failed", which is the distinction empty states most often get wrong.
