---
source: stories/collab/CommentsInspectorChrome.stories.tsx
title: 'Collaboration/Comments Inspector Chrome'
blocks: 6
roundtrip: true
sourceHash: baedc27213b2e2f0
---

<!-- @component -->

The header and the error state of the comments inspector, the panel that slides in beside a document to show its comment threads, is where the two decisions on this surface live.

|        |                                                       |
| ------ | ----------------------------------------------------- |
| Source | `packages/sanity/src/core/comments/plugin/inspector/` |
| Tier   | CHROME                                                |

The inspector _body_ needs an addon dataset (comments live in a separate dataset from content) and is out of scope. Its chrome does not.

> **Why the header matters more than it looks:** it carries an open/resolved toggle, and that toggle is the answer to a question every commenting system has to settle - what happens to a resolved thread? Deleting it loses the reasoning; leaving it in the list buries the live discussion under settled ones. Sanity keeps both and puts a segmented control at the top, so resolved threads are one click away and zero clicks in the way. Note it is a two-value segmented control rather than a filter dropdown: with exactly two states, a dropdown would hide half the model behind a click.

The `mode` prop reflects whether comments are on a paid plan or in upsell - the same component serves both, with the upsell variant losing the controls it cannot honour.

<!-- @story Header -->

The header in its default state, showing open threads. Click between Open and Resolved: the view is stateful here, so the control behaves as it does in the studio rather than posing.

<!-- @story HeaderResolved -->

Pinned to the resolved view. Worth having separately because it is the state a reader arrives in after resolving a thread, and the one where the header has to make it obvious that the list you are looking at is not the live one.

<!-- @story HeaderUpsell -->

On a plan without comments. The same header renders in `upsell` mode, dropping the controls it could not honour rather than showing them disabled.

That is the opposite call from `CreateReleaseMenuItem`, which keeps its disabled row with a tooltip - and both are defensible for different reasons. A disabled control teaches you the feature exists and you cannot use it; removing it keeps a surface you are only browsing from looking broken. The inconsistency is worth noticing rather than assuming one of them is wrong.

<!-- @story Error_ -->

The inspector could not load its comments - usually the addon dataset being unreachable, which is a distinct failure from the document itself failing.

It shows the underlying `error.message` rather than a generic sentence. For a failure whose most common cause is a dataset that has not been provisioned, the raw message is the part a developer can act on, and an editor loses nothing by seeing it.

<!-- @story InContext -->

Header over an error, as the panel would compose them. The body between them is the part that needs an addon dataset; everything framing it is here.
