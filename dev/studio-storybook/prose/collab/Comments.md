---
source: stories/collab/Comments.stories.tsx
title: 'Collaboration/Comments'
blocks: 1
roundtrip: true
sourceHash: 57c947d0b564abfe
---

<!-- @component -->

Comments is the surface where document conversation lives: threads pinned to the fields they discuss, each one repliable, resolvable and reactable.

|        |                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source | `packages/sanity/src/core/comments/`. Studio-only, no DS equivalent                                                                                                                                                                                                                                                                                                                                          |
| Tier   | SERVICE. The collaboration layer riding on the document (inspector list, field seam, PTE composer); it decorates the core edit loop rather than being it, but couples deeply through fields and realtime                                                                                                                                                                                                     |
| Audit  | 🔴 needs-work (`collaborative-presence`). The add-comment affordance on a field is hover-only (the field-actions floating card mounts at `opacity: 0` under `@media (hover: hover)`, `packages/sanity/src/core/form/components/formField/FormFieldBaseHeader.tsx:72-99`), and comment badges show totals, not presence: nothing tells you who else is here or where they are working before you open a panel |

This is the comment-threads layer on a document: the inspector list of threads, the per-field add-comment button, and the reply, resolve, and react loop that rides on top. It decorates the core edit loop rather than being it, but it couples deeply, through the fields it attaches to and the realtime that keeps everyone in sync.

The list stories mount the **real** `CommentsList` (the component the comments inspector renders) with fixture threads. The stateful demo wires every callback, reply, edit, delete, resolve/reopen, reactions, to a local copy of the fixtures, so the full interaction surface works: replies land in the thread, resolving removes a thread from the open view, reactions toggle. Avatars and mention rows resolve through the real `createUserStore` batching over a fixture-serving mock client (`lib/mockCollabFixtures.tsx`).

Harness notes: the `comments` locale bundle is plugin-registered in a real Studio and is added to the shared harness i18next instance by the fixture module. Timestamps are offsets from load time, so relative labels ("2 hours ago") render identically on any day. Thread selection and scroll coordination (`onPathSelect` into the form) are inert here: there is no host document form.

> **Why it matters:** both collaboration gaps the audit flagged are here to see. The add-comment affordance on a field is hover-only: it stays invisible until the pointer arrives, so nothing tells a touch user or a scanner that commenting exists. And the field badge shows a total, not presence: a count, never who else is in the thread or here right now. The Current and Recommended pair below walks both.
