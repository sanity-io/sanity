---
source: stories/beta/CanvasAndFeedback.stories.tsx
title: 'The launch announcement'
blocks: 6
roundtrip: true
sourceHash: 1fd1155eab693410
---

<!-- @component -->

Unlinking a document from Canvas and reporting a problem to Sanity sit at opposite corners of the studio, but they share a shape: both hand something to a system outside the studio and cannot fully control what happens next.

|          |                                                                         |
| -------- | ----------------------------------------------------------------------- |
| Source   | `core/canvas/actions/UnlinkFromCanvas/` and `core/feedback/components/` |
| Tier     | SERVICE                                                                 |
| Patterns | `error-messages`                                                        |

`UnlinkFromCanvasDialog` is the more consequential. A document linked to Canvas is authored _there_, and unlinking severs that connection: the Studio copy stops receiving updates. Reversible in principle, disorienting in practice. It confirms and reports rather than acting silently.

`FeedbackDialog` is the one users see. It posts to Sentry with a screenshot attachment, and its `dsn`, `source` and `feedbackVersion` props are the reason the same component can serve several trigger points while keeping the reports distinguishable at the other end.

> **Why it matters:** both are outbound dialogs, so they get a status machine (idle, loading, success or error) rather than a simple confirm, and the error and success arms are the ones a developer never sees while building the happy path.

<!-- @story UnlinkIdle -->

The confirmation, before anything happens. The document is named, because "unlink from Canvas?" without a subject is the shape of confirmation people click through.

<!-- @story UnlinkLoading -->

In flight. The dialog stays open and the confirm goes to a loading state - the link still exists until the operation returns, and closing early would claim otherwise. Same discipline as every other outbound action in this catalog.

<!-- @story UnlinkError -->

The arm most dialogs never implement. The unlink failed, the dialog reports why and stays open so the action can be retried - rather than closing and firing a toast, which would leave the user unsure whether the document is still linked.

This is the state worth having a story for precisely because you cannot reach it on demand while developing.

<!-- @story Feedback -->

The report-a-problem dialog. Note the props that never appear on screen: `source`, `feedbackVersion` and `extraTags` are all metadata travelling with the report so it can be routed and grouped once it arrives.

`feedbackVersion` in particular is a small piece of foresight - it lets the receiving end tell reports made under one tag schema from reports made under a later one, the same way telemetry consent is versioned. Without it, changing the tags silently corrupts every historical comparison.

<!-- @story FeedbackWithTags -->

The same dialog raised from a named surface with extra tags attached. Identical to the reader; entirely different on arrival, which is the point of keeping the identifying metadata out of the visible copy.
