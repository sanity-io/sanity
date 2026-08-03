---
source: stories/overlays/ConfirmDeleteDialog.stories.tsx
title: 'Overlays & Navigation/Confirm Delete Dialog'
blocks: 1
roundtrip: true
sourceHash: 315bcf10213fa67f
---

<!-- @component -->

ConfirmDeleteDialog is the last checkpoint before an editor deletes a document version, and the only place in Studio that names which other documents point at what is about to disappear, except when it silently declines to.

|           |                                                                                                                                                                                                                                                                                                                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source    | `packages/sanity/src/core/documentGroupInventory/components/ConfirmDeleteDialog.tsx`                                                                                                                                                                                                                                                                                                |
| Tier      | CORE. The last checkpoint before an editor deletes a document version                                                                                                                                                                                                                                                                                                               |
| Audit     | 🔴 needs-work (`spinners-loading`, `similarity`). No on-screen indication a reference check is running at all (see `CheckInProgress`), and a failed check renders the identical generic message a failed delete would (see `ReferenceCheckErrors` vs `DeleteMutationFails`), while also re-enabling the confirm button through a different guard than the one the checked path uses |
| Patterns  | `spinners-loading` · `similarity` · `destructive-friction`                                                                                                                                                                                                                                                                                                                          |
| Structure | one `Dialog` body, three independent conditionals: an `error` card, a `VersionsPreviewList` of what is about to be lost, and, only when `warnIncomingReferences` is true, a caution banner plus the module-local `References` list                                                                                                                                                  |

`warnIncomingReferences` (`deletionMachine.ts` guard `shouldWarnIncomingReferences`) requires both conditions: the selection includes a published id (`ids.some(isPublishedId)`), and at least one reference was actually found. Delete only drafts or only versions, however many other documents point at them, and this dialog never mentions references at all: the warning is published-id-gated, not reference-count-gated. `NoIncomingReferences` below reproduces the "references exist, warning does not show" half; the draft/version-only half needs no separate story, it is the same code path with zero references.

References, not just a count: when the warning fires, `References` (module-local, unexported, reachable only through this branch) lists the actual referring documents via the injected `ReferencePreviewLink`, not merely "N documents reference this." Internal (same-dataset) references are capped at 100 by the query that feeds this dialog (`*[references($documentId)][0...100]` in `useReferringDocuments.ts`); cross-dataset references have no such client-side cap here. Either list truncates against its own `totalCount`, and `OtherReferenceCount` (`ConfirmDeleteDialog.styles.tsx`, exported, storied standalone below) says so, except its one piece of copy is written for the cross-dataset case and is misleading when it fires for an internal-reference cap; see `TruncationTooltipMismatch`.

> **Why it matters:** an editor who deletes only drafts or scheduled versions never sees this dialog say a word about references, no matter how many other documents point at the published document underneath. The gate is "are you deleting something published," not "will this break something."

Fixture note: `components.DocTitle` and `components.ReferencePreviewLink` are hand-built stand-ins for the real `structure/components/DocTitle.tsx` and `structure/components/confirmDeleteDialog/ReferencePreviewLink.tsx`. Both real components need a live document pane / pane router this dialog never opens one of, and are the document-pane caller’s concern, not this one’s (see `DocumentStatusBarActions.tsx`). `components.VersionsPreviewList` is the real component: it only needs schema and the seeded preview store, both cheap to provide here.
