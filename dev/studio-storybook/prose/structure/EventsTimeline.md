---
source: stories/structure/EventsTimeline.stories.tsx
title: 'Document Status/Events Timeline'
blocks: 7
roundtrip: true
sourceHash: 8aeb8daf0f101099
---

<!-- @component -->

A single editing session produces dozens of mutations, and showing them raw would bury a publish event under forty keystroke transactions, so the design decision that makes this panel usable is merging.

|          |                                                                                   |
| -------- | --------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/structure/panes/document/timeline/events/EventsTimeline.tsx` |
| Tier     | SERVICE                                                                           |
| Patterns | `undo-timeline` · `draft-publish-lifecycle`                                       |

The revision history panel: every publish, edit, unpublish and schedule that has happened to a document, newest first, and the control for jumping back to any of them. Entirely prop-driven: an array of events, a selected id, and two callbacks. No store, no query.

Events are typed rather than free-text: `publishDocumentVersion` carries a `publishCause` distinguishing a manual publish from a release publish from a scheduled one. The same visible action has three different meanings, and the history knows which.

> **Why it matters:** this is the studio's answer to what happened to this document and can I go back. Consecutive edits by the same people collapse into one row carrying every contributor and the transactions inside it, "Ada and Bo edited this", expandable to the detail. The timeline is a summary of history rather than a log of it, and that is the difference between a panel an editor uses and one they scroll past.

Harness note: timestamps are pinned to fixed instants. The panel renders relative times, so the labels drift as the real clock moves; the ordering and the merging, which are what the stories are about, do not.

<!-- @story Default -->

Five events, newest first: an edit, a publish, another edit, a release publish, and the original creation. Read the two publish rows against each other - one was a person pressing Publish, the other was a release going out, and they say so.

<!-- @story WithSelection -->

Selecting an event is how you look at the document as it was at that moment. Click the rows: selection is stateful here, so the panel behaves as it does in the studio rather than posing.

The selected row is marked rather than merely highlighted, because this selection changes what the whole document pane beside it is showing - a subtle hover-style treatment would under-report the consequence.

<!-- @story HasMore -->

With `hasMoreEvents`, the list offers to fetch older events rather than pretending the history ends. Paginating history is not optional at scale - a document edited daily for two years has thousands of events - and the panel is honest that what you are looking at is a window.

<!-- @story SingleEvent -->

One event, because the document was just created. The panel renders it as a normal row rather than substituting an empty state - correct, since "created" is real history and the shortest possible true answer.

<!-- @story Empty -->

An empty event list. Storied to pin what the panel does with nothing to show, which in a history view is a state you reach whenever the event log has not loaded yet or has been cleared.

<!-- @story LongHistory -->

Nineteen events against a `listMaxHeight`, which is where the panel spends most of its real life. Scroll it: the height is a prop rather than a fixed value, because the panel shares a pane with a document header whose height varies.
