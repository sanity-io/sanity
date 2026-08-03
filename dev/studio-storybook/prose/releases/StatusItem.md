---
source: stories/releases/StatusItem.stories.tsx
title: 'Releases/Status Item'
blocks: 5
roundtrip: true
sourceHash: 359b78833edef9c2
---

<!-- @component -->

Twenty lines of layout with no logic in it at all, storied anyway because the alignment it performs is finicky and easy to get subtly wrong by hand.

|        |                                                                    |
| ------ | ------------------------------------------------------------------ |
| Source | `packages/sanity/src/core/releases/tool/components/StatusItem.tsx` |
| Tier   | CHROME                                                             |

One line of "who did what, when" in the footer of a release dashboard: an optional avatar, a muted line of text, nothing else. `ReleaseStatusItems` above it renders two of these side by side and depends on both matching exactly.

> **Why it matters:** with an avatar the text gets a smaller left padding than usual, and the avatar box carries a small negative margin on an inner element. Both exist to pull the avatar and the text onto a shared optical baseline, because an avatar is a circle and text is not: aligning their bounding boxes leaves the circle looking low. That negative margin is the kind of correction that gets deleted by anyone tidying up who has not seen the two variants next to each other, which is exactly what the first story below is for.

<!-- @story WithAndWithoutAvatar -->

The two forms, stacked so the compensating padding is visible. Both lines of text start at the same optical position despite one of them having a 21px avatar in front of it - that is the `paddingLeft` swap doing its job. Cover the avatar and the two rows still read as a column.

<!-- @story LoadingAvatar -->

The release dashboard renders its footer before the event log has loaded, so it has a timestamp but not yet an author. Rather than shift the layout when the avatar arrives, it renders an `AvatarSkeleton` of the same size - the row is laid out once and stays put.

<!-- @story RichText -->

`text` is a `ReactNode`, not a string, which is what lets the real call site put a live `RelativeTime` inside it. The timestamp keeps itself current without the status item knowing anything about time.

<!-- @story InContext -->

What `ReleaseStatusItems` builds: at most two of these in a row, the creation event and then whichever one of publish, archive or unarchive happened last. It is a deliberately short history - the footer answers "who made this and what became of it", and the full event list lives in the activity panel.
