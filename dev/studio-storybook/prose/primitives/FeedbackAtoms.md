---
source: stories/primitives/FeedbackAtoms.stories.tsx
title: 'UI v3 Primitives/Feedback'
blocks: 1
roundtrip: true
sourceHash: 84a0ccfa8e1f23dd
---

<!-- @component -->

Spinner and Skeleton are how Studio shows a pane waiting on data without lying about the shape of what's coming: an indeterminate spinner when there is no progress to report, a shimmer placeholder when there is a layout worth holding still.

|          |                                                                                                                                                                                                     |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `@sanity/ui` primitives: the activity spinner (`Spinner`) and the skeleton placeholders (`Skeleton`, `TextSkeleton`)                                                                                |
| Tier     | ATOM. Consumed by any pane that waits on data: a document list shows `TextSkeleton` rows before a query resolves, a preview shows a `Skeleton` block for its media, a busy action shows a `Spinner` |
| Audit    | ⚪ not-audited as a unit; instances inherit whatever the consuming component’s audit found                                                                                                          |
| Patterns | `spinners-loading`                                                                                                                                                                                  |

Reach for `Spinner` only when the total is unknown; once you know `done / total`, the determinate `ProgressIcon` (Lists & Data) tells the reader more. A skeleton should match the real content box it stands in for, so the layout does not shift when the data lands.
