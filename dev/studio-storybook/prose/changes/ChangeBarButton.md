---
source: stories/changes/ChangeBarButton.stories.tsx
title: 'Document Pane/Change Indicators/ChangeBarButton'
blocks: 1
roundtrip: true
sourceHash: c8cf4eb00b1006cd
---

<!-- @component -->

A real, always mounted button that is invisible at rest by design: a generous, forgiving hit target over the change bar rather than a control that competes for attention, drawn with zero opacity until the pointer arrives.

|           |                                                                             |
| --------- | --------------------------------------------------------------------------- |
| Source    | `packages/sanity/src/core/changeIndicators/ElementWithChangeBar.styled.tsx` |
| Tier      | SERVICE                                                                     |
| Mechanism | fully transparent at rest, fades in on hover, opens review changes on click |

A screenshot of any story here taken without an active hover shows nothing where the button sits, no outline, no fill, no border. That is not an empty story. The button is present in the document, sized, positioned, and clickable; it is simply drawn with no visible surface until the pointer reveals it.

> **Why it matters:** invisible controls are only safe when their hit area is honest. The dashed boxes in these stories mark the actual bounds so that claim is checkable rather than asserted, and the not-interactive story shows the one state where clicks pass straight through to whatever sits behind it.
