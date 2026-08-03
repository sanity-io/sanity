---
source: stories/changes/ChangeFieldWrapper.stories.tsx
title: 'Document Pane/Change Indicators/ChangeFieldWrapper'
blocks: 1
roundtrip: true
sourceHash: 42250abc81602b17
---

<!-- @component -->

Every diff row in the review-changes panel reports itself as changed, unconditionally. There is no prop to say otherwise, because the one place this wrapper mounts never wraps anything that is not a real change.

|             |                                                                    |
| ----------- | ------------------------------------------------------------------ |
| Source      | `packages/sanity/src/core/changeIndicators/ChangeFieldWrapper.tsx` |
| Tier        | SERVICE                                                            |
| Counterpart | `ChangeIndicator`, the same wrapper on the field side              |

It registers a change-side reporter under the same path the field-side counterpart uses, and forwards a click to the review-changes context so clicking a diff can jump the form straight to that field.

Because `isChanged` is hard-coded true with no prop to override it, this page cannot demonstrate an unchanged state; that branch belongs to the field side, not here.

> **Why it matters:** the click handler stops its own event from propagating, so clicking one diff never also triggers a parent diff's handler. The click-focus story below supplies a real context value and prints the path it receives, so that claim is evidence, not assertion.
