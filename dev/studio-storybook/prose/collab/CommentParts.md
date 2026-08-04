---
source: stories/collab/CommentParts.stories.tsx
title: 'Collaboration/Comment Parts'
blocks: 9
roundtrip: true
sourceHash: e41e505b5f6503b5
---

<!-- @component -->

CommentParts covers the four small pieces a comment thread is assembled from, each holding a decision of its own: the author avatar, the field breadcrumb, the reactions bar, and the delete confirmation.

|        |                                                 |
| ------ | ----------------------------------------------- |
| Source | `packages/sanity/src/core/comments/components/` |
| Tier   | CHROME                                          |

The thread itself is already storied under CMS Patterns/Comments. These are the parts it composes.

> **Why it matters:** comments in a studio are anchored to a field, not to a document, and that single fact shapes three of these four components. The breadcrumb exists because a comment several levels deep into a document is meaningless without its path. It elides the middle rather than the end, because the first and last segments carry the most meaning, the document type the comment is in and the field it is on, while the middle is array indices nobody reads. And the elision is not a truncation: the hidden segments go into a tooltip, so the path is folded rather than lost.

<!-- @story Avatars -->

Deriving initials looks trivial and is not. The regexes are Unicode property escapes (`\p{Alpha}`, `\p{White_Space}`) rather than `[A-Za-z]` and `\s`, so a name in any script produces initials rather than an empty avatar - the ASCII version silently returns nothing for most of the world.

The rule is first-and-last, not first-two, so a middle name does not displace the family name. And a single-word name yields one initial rather than a padded pair. Note "Prince" below.

<!-- @story Breadcrumbs -->

Under the limit, so every segment is shown. This is where a comment lives: not "on this document" but on one field inside it. The thread header spends its width on a path.

<!-- @story BreadcrumbsElided -->

Past the limit, and the interesting behaviour appears. The component keeps `ceil(max/2) - 1` segments from the front and `floor(max/2)` from the back, and collapses everything between them into a single `...` carrying the hidden segments in a tooltip. Hover it.

Eliding the MIDDLE is the decision. A conventional truncation would drop the tail, which here is the field you actually commented on - the one segment that cannot be guessed. The front and back are the orienting information; the middle is array indices and object wrappers.

<!-- @story Reactions -->

Reactions grouped by emoji with a count, plus the add-reaction button. Two details worth noticing.

The grouping is **sorted by first appearance** rather than by count, and the source says why: sorting by count means the row reorders itself whenever anybody reacts, so the button you were about to click moves out from under your cursor. Stable order beats useful order for a control you interact with.

And hovering a group names the people in it. A count answers "how many"; the tooltip answers "who", which in a review thread is the question actually being asked.

<!-- @story ReactionsEmpty -->

With no reactions the bar collapses to just the add button. Storied because the empty state of a reactions row is where most implementations either reserve dead space or vanish entirely, and this one does neither - the affordance stays, at its minimum size.

<!-- @story DeleteThread -->

Deleting the FIRST comment in a thread deletes the whole thread, and the dialog says so. `isParent` swaps every string - title, body and confirm label - rather than showing one generic message with a caveat.

That is the right shape for a destructive confirm: the difference between losing one comment and losing a conversation is exactly what the reader needs to weigh, and burying it in a subclause is how people delete things they meant to keep.

<!-- @story DeleteComment -->

The same dialog with `isParent: false`. Read the two side by side in the canvas: same layout, same critical confirm, entirely different stakes, and the copy is the only thing carrying that.

<!-- @story DeleteFailed -->

The error branch, which is the state most confirm dialogs never implement. The dialog stays open with the failure shown inside it rather than closing and firing a toast - correct, because the action did not happen and closing would imply it had.
