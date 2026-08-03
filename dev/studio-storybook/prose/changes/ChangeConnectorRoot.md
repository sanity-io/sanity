---
source: stories/changes/ChangeConnectorRoot.stories.tsx
title: 'Document Pane/Change Indicators/ChangeConnectorRoot'
blocks: 1
roundtrip: true
sourceHash: 17f8f18ae89144ef
---

<!-- @component -->

A document pane wires up its change bars, its review-changes panel, and the connector painted between them through exactly one provider. Get that wiring wrong and the marks stop pointing at the fields they describe.

|            |                                                                                        |
| ---------- | -------------------------------------------------------------------------------------- |
| Source     | `packages/sanity/src/core/changeIndicators/overlay/ChangeConnectorRoot.tsx`            |
| Tier       | SERVICE                                                                                |
| Mounted by | `DocumentLayout.tsx:222-242`, around `DocumentPanel`, whenever a document pane renders |
| Timing     | 10ms trailing debounce, then one `requestAnimationFrame`                               |

It composes a review-changes context provider, a change tracker, a scroll container and the connector overlay into one mountable unit, so this page uses it exactly as production does rather than rebuilding its internals by hand.

The exported prop type declares only `children`, `className`, `isReviewChangesOpen`, `onOpenReviewChanges` and `onSetFocus`; it does not extend a div's own HTML props, so there is no typed `style` prop to reach for even though extra props are spread onto the inner scroll container at runtime. The harness below reaches the same effect through `className` and a scoped style tag instead, anchored on this component's own rendered element rather than an outer wrapper: the overlay measures every field against that same node, so giving position to any other ancestor would measure from one origin and paint from another.

The timing mechanics live on the connector overlay page and in the harness file next to this one. Both were written from source before a static build existed to check them against; the build has since confirmed the geometry, with real path elements present in these stories.

> **Why it matters:** this page mounts the real production entry point, not a hand-assembled stand-in, so the coupling between the panel and the review-changes panel shows through the path a studio actually takes to get there.
