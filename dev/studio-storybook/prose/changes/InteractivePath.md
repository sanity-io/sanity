---
source: stories/changes/InteractivePath.stories.tsx
title: 'Document Pane/Change Indicators/InteractivePath'
blocks: 1
roundtrip: true
sourceHash: cc3e9baa43f8141d
---

<!-- @component -->

A one-pixel line is a poor click target. This is its invisible, wide twin, drawn along the identical path purely to widen the hoverable and clickable area around the thin visible stroke.

|               |                                                                          |
| ------------- | ------------------------------------------------------------------------ |
| Source        | `packages/sanity/src/core/changeIndicators/overlay/Connector.styled.tsx` |
| Tier          | SERVICE                                                                  |
| Stroke widths | 16px hit area over a 1px visible line, same path data                    |

At rest it is fully transparent, and only the stroked outline itself is clickable, not its bounding box. A static, unhovered screenshot of this component alone shows literally nothing.

> **Why it matters:** this is the same invisible-by-design pattern the click target earlier in this chapter uses: present, sized, interactive, and correctly showing nothing until hovered.
