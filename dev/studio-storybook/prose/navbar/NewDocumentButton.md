---
source: stories/navbar/NewDocumentButton.stories.tsx
title: 'Acme Content'
blocks: 1
roundtrip: true
sourceHash: 787bd825a7a5bbf5
---

<!-- @component -->

The navbar's create affordance, the plus that opens the list of document types an author can start, is deliberately presentational: the schema walk, the permission checks, and the sort all happen upstream, and the button just renders the resulting list and its empty, loading, and no-permission states.

|        |                                                                                        |
| ------ | -------------------------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/studio/components/navbar/new-document/NewDocumentButton.tsx` |
| Tier   | CHROME, the entry point to creating, not the creation                                  |

> **Why it matters:** separating the button from the hook that computes its options is the pattern here. The story feeds it fixture options, so the states (has options, loading, cannot create) are each addressable without a live schema.

**Tooltip ordering, read from the source** (`tooltipContent`, L177-189). The check is `!hasNewDocumentOptions` first, `canCreateDocument` second: an empty `options` array always yields the "No document types" tooltip, no matter what `canCreateDocument` says, because the permission branch is never reached. To actually show the insufficient-permissions tooltip, `options` must be non-empty (declared types exist) and `canCreateDocument` must be `false` (the person is granted none of them); an empty array is not a stand-in for that, it is a different situation entirely. `CannotCreate` below was fixed to reflect this: it now passes populated, all-`hasPermission: false` options rather than `[]`.
