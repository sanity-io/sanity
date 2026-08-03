---
source: stories/collab/CommentsListStatus.stories.tsx
title: 'Collaboration/Comments List Status'
blocks: 7
roundtrip: true
sourceHash: 2db0a6e5be6158b1
---

<!-- @component -->

The status slot at the top of a document's comments list is what shows in place of the thread list while it errors, loads, or has nothing in it yet.

|        |                                                                                      |
| ------ | ------------------------------------------------------------------------------------ |
| Source | `packages/sanity/src/core/comments/components/list/CommentsListStatus.tsx`           |
| Tier   | CHROME. It never renders a comment itself, only the states around the absence of one |

It is a pure `if`-ladder over four flags (`error`, `loading`, `hasNoComments`, `status`), checked in that order, with no memo and no local state. The empty-state copy branches again on `status` (`open` vs `resolved`), so the same `hasNoComments` flag produces two different messages depending on which tab the reader is looking at.

> **Why the order matters:** the parent list component derives its empty flag from the thread count alone, independent of whether a fetch is in flight, so while a first fetch is loading there are no comments yet, and the empty flag is already true by the time the loading flag is also true. Checking the error and loading branches before the empty-comments branch is what keeps a loading list from flashing an empty-state message before its first paint.

<!-- @story Loading -->

The loading branch (source line 50): `LoadingBlock`, not the `Flex`/`Text` shape the other three branches share. It is the only branch that delegates to a shared primitive instead of composing its own layout inline.

<!-- @story EmptyOpen -->

The empty-state branch (source line 54) with `status="open"`: "No open comments yet." / "Open comments on this document will be shown here." This is what a reader sees on a document with zero comments at all, since it opens on the open tab.

<!-- @story EmptyResolved -->

The same branch with `status="resolved"`: "No resolved comments yet." / "Resolved comments on this document will be shown here." Reached by switching to the resolved tab on a document where every thread is still open (or there are none).

<!-- @story HasComments -->

The fourth return, `null` (source line 72). Reached once `error`, `loading` and `hasNoComments` are all falsy - the ordinary case once a thread exists. This component draws nothing at that point; `CommentsList.tsx` renders the actual thread list past it. The frame below is empty by design, not a broken story.

<!-- @story Matrix -->

All five appearances side by side: the four visible branches, plus a labeled stand-in for the null return.

<!-- @story InContext -->

The empty-open state as it sits in `CommentsList.tsx`: this component fills the space where threads would otherwise be, inside the same `flex={1}` column the real list scrolls in.
