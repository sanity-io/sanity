---
source: stories/changes/ChangeBarMarker.stories.tsx
title: 'Document Pane/Change Indicators/ChangeBarMarker'
blocks: 1
roundtrip: true
sourceHash: e6815b73ae7e7d36
---

<!-- @component -->

The one-pixel line an editor actually sees. Everything else in this family is either an invisible hit target or a layout shell; this is the mark itself.

|                |                                                                             |
| -------------- | --------------------------------------------------------------------------- |
| Source         | `packages/sanity/src/core/changeIndicators/ElementWithChangeBar.styled.tsx` |
| Tier           | SERVICE                                                                     |
| Opacity states | 0.5 resting, 1.0 on focus, 0 when not changed, hidden when disabled         |

None of those states live on the marker itself; it takes no relevant props at all. Every one of them is a selector keyed off its wrapper, so mounted with no wrapper ancestor none of the dimming or hiding rules match, and the mark defaults to fully opaque, more visible than any real resting state ever is.

> **Why it matters:** the isolated story below is that literal, misleadingly bold render, kept rather than deleted because it makes the point on its own: every other story on this page nests the real ancestor, and the opacity shown only matches production when that ancestor is there.
