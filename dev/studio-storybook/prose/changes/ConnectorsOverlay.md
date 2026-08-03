---
source: stories/changes/ConnectorsOverlay.stories.tsx
title: 'Document Pane/Change Indicators/ConnectorsOverlay'
blocks: 1
roundtrip: true
sourceHash: bb1a1d23e60825d4
---

<!-- @component -->

This is the one page in the family that could pass every gate while drawing nothing at all: everything it renders comes from what it reads back out of a shared tracker and measures off real, laid-out elements, never from its own props.

|           |                                                                                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source    | `packages/sanity/src/core/changeIndicators/overlay/ConnectorsOverlay.tsx`                                                                                                         |
| Tier      | SERVICE                                                                                                                                                                           |
| Timing    | both reporters register synchronously at mount; the tracker snapshot updates on a 10ms trailing debounce with no leading edge; this layer re-measures on the next animation frame |
| Confirmed | the static build paints real path geometry, driven only by the `hasFocus` prop, no pointer and no `play` function                                                                 |

It finds the one change bar with hover or focus, matches it to its diff in the review panel, and draws the connector between the two real elements. This page builds the tracker and context stack by hand, without the production root component, specifically so this layer can be storied on its own; the sibling page shows the same coupling through the real entry point instead.

The unreachable-target case: this layer filters its candidate pairs down to only those where both the field element and the change element are present. If a field is hidden by a conditional and unmounts, its reporter cleans itself out of the tracker entirely, so there is simply nothing left to find for that pair, and it drops out.

> **Why it matters:** a hidden field produces no stale reference, no crash, no line pointing at an element that no longer exists. The whole connector for that field disappears cleanly, a different outcome from a hidden-conditional-field bug the ledger already tracks in the comments panel, and not the same class of failure.
