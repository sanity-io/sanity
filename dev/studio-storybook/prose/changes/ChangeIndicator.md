---
source: stories/changes/ChangeIndicator.stories.tsx
title: 'Document Pane/Change Indicators/ChangeIndicator'
blocks: 1
roundtrip: true
sourceHash: 4a43b64e7a8d4082
---

<!-- @component -->

Every changed field in a Studio form renders inside this wrapper. It draws the vertical bar and registers the field with a tracker, so the review-changes panel, elsewhere on the page, can find it.

|             |                                                                                       |
| ----------- | ------------------------------------------------------------------------------------- |
| Source      | `packages/sanity/src/core/changeIndicators/ChangeIndicator.tsx`                       |
| Tier        | SERVICE. Surfacing what changed enriches editing; it is not the act of editing itself |
| Counterpart | ChangeFieldWrapper, the matching diff row in the review-changes panel                 |

This is the field-side half of a pair. Its counterpart draws the matching row, and the connector overlay draws the line between the two whenever this side has focus or hover. None of that coordination is visible from this component mounted alone, only from mounting both sides together.

> **Why it matters:** the in-context story pairs the form field with the review-changes row for the same path, the way a document pane actually does. Neither one draws the connecting line; that belongs to a third component, shown on its own page.
