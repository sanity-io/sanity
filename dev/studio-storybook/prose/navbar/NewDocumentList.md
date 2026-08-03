---
source: stories/navbar/NewDocumentList.stories.tsx
title: 'Viewer'
blocks: 1
roundtrip: true
sourceHash: e48de85b3e430cea
---

<!-- @component -->

The list body inside the navbar's new-document button is deliberately dumb: no schema reading, no permission checking, just four branches over the props it is handed, and the branches turn out to matter, because a permission problem and a configuration problem could easily read as the same empty screen here and do not.

|        |                                                                                                                                                                                                                                   |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/studio/components/navbar/new-document/NewDocumentList.tsx` (org contract: read the real thing, do not reimplement)                                                                                      |
| Tier   | CHROME. The body of the "New document" popover and dialog; every author meets it every time they start a document from the navbar                                                                                                 |
| Audit  | 🟢 holds. The three empty-ish states (loading, no search results, no document types) are each distinguishable, and permission denial never collapses into the "no document types" empty. See the body below for the full argument |

Four returns in source order: `loading` opens a loading block; `!hasOptions && searchQuery` reads "No results for {searchQuery}"; `!hasOptions` alone reads "No document types found"; otherwise the real `CommandList` renders. `hasOptions` also ANDs in `!loading`, which is always true by the time either empty branch reads it (both come after the `loading` early return), a harmless but pointless condition, the same species of finding as a dead branch, just smaller.

`useNewDocumentOptions` (the caller's hook) tags every declared template with `hasPermission` but never removes the ones a person cannot create. So a person who may create nothing still gets a full `options` array, `hasOptions` is `true`, and the real list renders: every row disabled, every row wrapped in a tooltip carrying `InsufficientPermissionsMessage`. The empty state this component owns ("No document types found") is reachable only when the caller's `options` array is itself empty, which happens when the studio declares no creatable types, or every declared type was filtered as deprecated one level up in `NewDocumentButton`, never as a side effect of permissions. `AllPermissionsDenied` and `NoDocumentTypesDeclared` below are the same message space and genuinely different inputs; they do not collapse.

> **Why it matters:** this is the shape that broke elsewhere this week (`PreviewReferenceValue`, `DiffFromTo`): a permission problem and a configuration problem reading as the same screen, so the person cannot tell whether to ask an administrator or ask whoever owns the schema. This component keeps that distinction, because the deciding work of whether to remove an option was never pushed down into it in the first place. The caller keeps every option and lets this component render the honest, disabled truth.
