---
source: stories/changes/ChangeBar.stories.tsx
title: 'Document Pane/Change Indicators/ChangeBar'
blocks: 1
roundtrip: true
sourceHash: e579ed11a444ec74
---

<!-- @component -->

Neither of the two children this container holds carries any height of its own; both are positioned absolutely, so without an anchor between them and the field beside them, both collapse to nothing. This container is that anchor.

|           |                                                                             |
| --------- | --------------------------------------------------------------------------- |
| Source    | `packages/sanity/src/core/changeIndicators/ElementWithChangeBar.styled.tsx` |
| Tier      | SERVICE                                                                     |
| Mechanism | `position: relative`, no intrinsic height of its own                        |

It gets its own height for free in production: a surrounding flex row stretches it to match the field it sits beside. Mounted with no stretching sibling, it collapses to zero height and its children render invisibly along with it.

> **Why it matters:** the two stories below make the failure literal. One mounts this component with nothing around it, and the marker vanishes. The other gives it the height its real home provides, and the marker reappears. Neither story is staged; both are the same markup with one property changed.
