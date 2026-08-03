---
source: stories/changes/RightBarWrapper.stories.tsx
title: 'Document Pane/Change Indicators/RightBarWrapper'
blocks: 1
roundtrip: true
sourceHash: caa7769a23267800
---

<!-- @component -->

This is the short mark drawn at the connector's destination end, echoing the field-side change bar from the other side of the panel: the same clamped-rectangle geometry from earlier in this chapter, restyled and repositioned.

|                |                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Source         | `packages/sanity/src/core/changeIndicators/overlay/Connector.styled.tsx`                                                                 |
| Tier           | SERVICE                                                                                                                                  |
| Positioned at  | one pixel wider than the field it marks                                                                                                  |
| Edge behaviour | shares `ClampedRect`'s clamp: only the near edge is clamped, so a target taller than its bounds still overflows the far edge uncorrected |
