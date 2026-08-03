---
source: stories/collab/CommentInput.stories.tsx
title: 'Collaboration/Comment Input'
blocks: 1
roundtrip: true
sourceHash: 81202f49d2d6d36e
---

<!-- @component -->

Comments turn the margins of a document into a place a team can talk, and this composer, with live mentions, is the box that conversation happens in wherever comments live in Studio.

|        |                                                                                                                                                                                                                                                                                         |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/comments/components/pte/comment-input/CommentInput.tsx`. Studio-only, no DS equivalent                                                                                                                                                                        |
| Tier   | SERVICE. The comments-specific Portable Text composer (a purpose-built PTE instance with a mentions plugin), reused across the inspector, field popovers and task descriptions                                                                                                          |
| Audit  | ⚪ not-audited individually. The composer itself was not a scored surface; its chapter-14 pattern (`collaborative-presence`) fails on the field-seam affordance and badges, which the Comments page reproduces. The mentions affordance in here worked as expected during the benchmark |

It is a Portable Text editor built for one job: write a comment, drop an `@mention`. Studio reuses the same instance everywhere comments surface: the comments inspector, the per-field popover, a task description. Learn it here and it is known across all three.

These stories mount the **real** `CommentInput`, a live editor, not a mock. Type `@` (or press the mention button) and the real mentions popover opens over the fixture user list, including the disabled "no access" treatment for a user without read permission on the document. Submit with Enter; Escape opens the real discard flow when there is content.

Harness notes: the current-user avatar and mention rows resolve through the real `createUserStore` against a fixture-serving client. The mentions popover portals; interact in the story canvas, since docs previews reserve height for it.

> **Why it matters:** the mentions popover portals out of the composer to the document body rather than nesting inside the card. Interact with it in the full story canvas: in the compact docs preview the popover renders outside the reserved frame. These stories set an explicit height.

The page closes **in context**: the field-comment composer open on the **Title** of the "Anna Karenina" draft, an editor typing a note in the margin, mention live.
