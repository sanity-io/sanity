---
source: stories/changes/ClampedRect.stories.tsx
title: 'Document Pane/Change Indicators/ClampedRect'
blocks: 1
roundtrip: true
sourceHash: b0fb84bc3036de38
---

<!-- @component -->

A connector's right-hand bar must never draw past the edge of the scroll container it lives in. This is the primitive that holds that line: an SVG rectangle that clamps its own position and size to stay inside a given boundary.

|         |                                                                     |
| ------- | ------------------------------------------------------------------- |
| Source  | `packages/sanity/src/core/changeIndicators/overlay/ClampedRect.tsx` |
| Tier    | SERVICE                                                             |
| Used by | `RightBarWrapper`, the connector's right-hand bar                   |

The clamp only pulls the rectangle's near edge, top and left, in toward the bounds; it never pulls the far edge, bottom and right, back. The size shrinks by however much the position moved, and floors at zero rather than going negative. A rectangle placed entirely below or to the right of its bounds is not clamped at all: it draws exactly where it was asked to, outside the box. See `OverflowsBottom` below.

> **Why it matters:** a badly out-of-range input does not clamp to as much of the rectangle as overlaps the bounds. It collapses to a zero-size point sitting on the bounds' own corner instead, a different failure than the honest clamp above it, and the far-outside story makes that difference visible rather than assumed.
