---
source: stories/changes/Connector.stories.tsx
title: 'Document Pane/Change Indicators/Connector'
blocks: 1
roundtrip: true
sourceHash: 52c4a2c9ad462512
---

<!-- @component -->

The subsystem takes its name from this component: given a changed field and its diff, each with its own scroll boundary, it draws the curved line between them, the destination bar, and any arrows for the ends that have scrolled out of view.

|                      |                                                                   |
| -------------------- | ----------------------------------------------------------------- |
| Source               | `packages/sanity/src/core/changeIndicators/overlay/Connector.tsx` |
| Tier                 | SERVICE                                                           |
| Renders nothing when | both ends are out of bounds                                       |

One end out of bounds still draws: the visible line runs to an arrow at the boundary instead of to the real, off-screen rectangle. Only when both ends report out of bounds does the component render nothing at all.

> **Why it matters:** the both-ends-out-of-bounds story below is a genuinely empty render, by design, not a story that failed to find its subject.
