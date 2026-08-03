---
source: stories/changes/FieldWrapper.stories.tsx
title: 'Document Pane/Change Indicators/FieldWrapper'
blocks: 1
roundtrip: true
sourceHash: f696653fcf026d44
---

<!-- @component -->

The smallest component in this family does exactly one thing: it claims the remaining width of the change-bar row, so the field's own content has somewhere to grow into.

|        |                                                                             |
| ------ | --------------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/changeIndicators/ElementWithChangeBar.styled.tsx` |
| Tier   | SERVICE                                                                     |
| Layout | `flex-grow: 1; min-width: 0`                                                |

> **Why it matters:** the minimum width is doing real work, not decoration. Without it, a flex child with long unbreakable content, a long field title, an inline code value, refuses to shrink below its own intrinsic width and pushes the change bar out of the row instead of wrapping. The long-content story below is that failure averted.
