---
source: stories/changes/ChangeBarWrapper.stories.tsx
title: 'Document Pane/Change Indicators/ChangeBarWrapper (styled)'
blocks: 1
roundtrip: true
sourceHash: 36d6518dead3f353
---

<!-- @component -->

None of this component's own props change how it looks. They exist to hand the marker and the button nested inside it something to select against, and nothing else.

|        |                                                                             |
| ------ | --------------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/changeIndicators/ElementWithChangeBar.styled.tsx` |
| Tier   | SERVICE                                                                     |
| Layout | flex row, `position: relative`                                              |

Each modifier class the props toggle is an empty style block: a class name for the marker's and the button's own descendant selectors to key off, not a rule that draws anything here. Toggle these props with nothing nested inside and the render is identical either way; the story below nests a real marker so the effect the props actually drive has somewhere to show up.

> **Why it matters:** read the difference in the marker, never in this wrapper. A page that judges this component by its own appearance will always see nothing change.
