---
source: stories/changes/ElementWithChangeBar.stories.tsx
title: 'Document Pane/Change Indicators/ElementWithChangeBar'
blocks: 1
roundtrip: true
sourceHash: b0be56dabb2e9fc4
---

<!-- @component -->

This is the assembly point: it decides whether a bar is drawn at all, and composes the wrapper, the marker, and the click target into the one thing an editor actually sees. The field-side entry point elsewhere mounts this component directly.

|                     |                                                                      |
| ------------------- | -------------------------------------------------------------------- |
| Source              | `packages/sanity/src/core/changeIndicators/ElementWithChangeBar.tsx` |
| Tier                | SERVICE                                                              |
| No bar renders when | disabled, or not changed                                             |

This is the field-side bar itself, the vertical mark and its click target, without the path-tracking machinery wrapped around it elsewhere.

> **Why it matters:** what looks like one bar brightening on hover is actually two different opacity rules stacking on the same spot. The visible marker sits dimmed by default and only reaches full opacity on focus, never on hover alone. The click target underneath is separately invisible at rest and only fades in on hover. Two rules, two triggers, one physical location.
