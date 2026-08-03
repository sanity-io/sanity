---
source: stories/changes/SvgWrapper.stories.tsx
title: 'Document Pane/Change Indicators/SvgWrapper'
blocks: 1
roundtrip: true
sourceHash: e3b3bfee845f6548
---

<!-- @component -->

With nothing inside it, this component is correctly invisible: no fill, no stroke, no border of its own, and it never even intercepts a click. Its only job is to be a correctly sized, correctly positioned coordinate space for whatever gets drawn inside it.

|             |                                                                                  |
| ----------- | -------------------------------------------------------------------------------- |
| Source      | `packages/sanity/src/core/changeIndicators/overlay/ConnectorsOverlay.styled.tsx` |
| Tier        | SERVICE                                                                          |
| Positioning | full-bleed, click-through, sized to fill its positioned ancestor                 |

> **Why it matters:** an empty render here is not a broken story. It is the correct behaviour of a bare canvas that has nothing yet to draw; every other story on this page gives it a child so its positioning becomes legible.
