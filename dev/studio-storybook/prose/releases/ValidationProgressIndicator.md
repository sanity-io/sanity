---
source: stories/releases/ValidationProgressIndicator.stories.tsx
title: 'Releases/Validation Progress Indicator'
blocks: 8
roundtrip: true
sourceHash: c414bddd63ccf596
---

<!-- @component -->

This component has a life cycle rather than a set of states, and the transitions are the design, except one of them was clearly never meant to fire the way it does.

|          |                                                                                                                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/releases/tool/detail/ValidationProgressIndicator.tsx`                                                                                                                    |
| Tier     | SERVICE                                                                                                                                                                                            |
| Audit    | 🟡 needs-work (`error-messages`). The error state collapses on the same 2.5s success timer, so the sentence explaining what is wrong removes itself from a release that cannot publish. Ledger #53 |
| Patterns | `error-messages`                                                                                                                                                                                   |

The small badge in a release dashboard that says whether the documents in this release are safe to publish. It is the answer to "can I press the button yet". Validation for a release is a fan-out: every document in it is validated independently, and they finish at different times. This component collapses that into one line, a progress ring while documents are still going, then a verdict.

While validating it shows a ring and a running count. When everything comes back clean it shows "All documents validated", and then, 2.5 seconds later, it shrinks to a bare checkmark and stays that way for the rest of the session, because a permanent green banner announcing that nothing is wrong is noise. That much is clearly deliberate.

What is less clearly deliberate is that the error state collapses on the same timer. "All documents validated, issues found" is on screen for 2.5 seconds and then reduces to a red circle whose meaning is available only on hover. The tone stays critical, so the badge still reads as wrong, but the sentence explaining what is wrong removes itself, on a clock, from a release you cannot publish. Timing it is the only way to see this; both outcomes look identical after three seconds apart from the glyph.

It also returns `null` when validation has neither started nor finished, which is the state the dashboard opens in, so the badge appears rather than flickering from empty to full.

The documents are built by `lib/releaseFixtures`, not fetched. `useReleaseDocuments` runs a live GROQ query and ignores the mocked release store entirely, so anything that takes `documents` as a prop is storied by handing it the array directly.

> **Why it matters:** the same 2.5-second timer that correctly retires a success message also retires an error message, and after three seconds the two states look identical apart from the glyph. A release that cannot publish loses its explanation on a clock, which is the wrong failure mode for a validation gate.

<!-- @story Validating -->

Two of four documents have come back. The ring is a real progress arc driven by `validatedCount / totalCount`, not a spinner - so on a large release it tells you whether the wait is nearly over or has barely begun.

<!-- @story AllValid -->

Everything came back clean. Leave this story open: after 2.5 seconds the text disappears and the badge shrinks to a checkmark, and it will not expand again. That is the transient-success rule in action - you get told once, then the space is given back.

<!-- @story HasErrors -->

One document failed validation. Watch this story from the moment it loads: for 2.5 seconds it reads "All documents validated, issues found", and then the text disappears and you are left with a red circle. The tone stays critical so the badge still signals a problem, and a tooltip still carries the message - but you have to know to hover for it.

The cause is that `isFinished` is `validatedCount === totalCount`, which is true whether the documents passed or failed, and the same 2.5-second timer runs off it. The state variable is even called `showCheckmark`, which suggests the error path was not what anyone had in mind when the timer was written. Filed as ledger #53.

The summary not naming the failing document is correct, incidentally - the document table below it carries the per-row detail, and this is only meant to stop you pressing publish. The problem is that after three seconds it barely does that either.

<!-- @story MinimalLayout -->

The same states with `layout="minimal"`, which drops the padding and the text from the start. Used where the badge sits inside something that already has a label - a table cell, a row of status chips - so the icon alone carries it.

<!-- @story GoingToUnpublish -->

A document set to be unpublished by this release carries `_system.delete`, and validation skips it entirely - the content is being removed, so whether it satisfies the schema is beside the point. `getDocumentValidationLoading` still counts it as validated, which is the right call: otherwise a release full of unpublishes would sit at a progress ring that never completes.

<!-- @story NothingToReport -->

Not a bug: with no document validating and none finished, the component returns `null`. This is the moment a release dashboard is first opened, before any validation has been kicked off. Storied explicitly because "renders nothing" is a decision, and an empty frame here is the proof that it was made on purpose.

<!-- @story InContext -->

Where it sits: beside the release title, above the document table, next to the publish button it is implicitly gating. Seen here the summary reads as a precondition rather than a notification, which is what it is.
