---
source: stories/overlays/ConfirmPopover.stories.tsx
title: 'Overlays & Navigation/ConfirmPopover'
blocks: 1
roundtrip: true
sourceHash: bfab8c13bab5cabc
---

<!-- @component -->

When an editor hits Delete, a full modal thrown over the whole screen is often too much weight for the moment. ConfirmPopover is the lighter touch: an inline are-you-sure that pops open right beside the button that triggered it, and closes the moment the editor answers it.

|                   |                                                                                                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source            | `packages/sanity/src/ui-components/confirmPopover/ConfirmPopover.tsx`, Studio-only (no design-system equivalent)                                                                                                        |
| Tier              | SERVICE. A Studio-only inline confirmation surface built on `@sanity/ui` `Popover`, used for lightweight destructive confirms anchored to their trigger                                                                 |
| Audit             | 🔴 needs-work (`destructive-friction`, `spinners-loading`). A generic "Confirm" gives a destructive action too little friction, and offering the confirm before a reference check completes lets an editor delete blind |
| Patterns          | `destructive-friction` · `spinners-loading` · `generous-borders`                                                                                                                                                        |
| Collision padding | 4px hardcoded on every floating-ui middleware; the ledger recommendation is 8 to 12px                                                                                                                                   |

Reach for it when the action is small and local, a delete on a list row, a discard on an inline edit, and you want the confirmation to feel attached to the thing it is confirming. Unlike `Dialog`, it anchors to a `referenceElement`, portals, constrains its own size, and closes on Escape or click-outside when it is the top layer. Its default button labels are the same localized `common.dialog.*` strings; `tone` defaults to `critical` and drives the confirm button's tone.

Edge gutter, a ledger candidate: `ConfirmPopover` is built on `@sanity/ui` `Popover`, whose floating-ui collision padding is a hardcoded 4px on every middleware (`flip`, `shift`, `size`, `offset`, `hide` in `@sanity/ui`'s `dist/_chunks/tabList.mjs`, for example `shift({padding: 4})`); it defaults to `placement="top"` with `fallbackPlacements: ["left","bottom"]` and adds no boundary padding of its own. Anchored near a container edge it therefore collision-shifts to settle just ~4px off that edge, a hairline that reads as flush or cramped (the captain's screenshot). This is a component default, not a story bug: 4px is a genuinely tiny minimum viewport-edge gutter for a floating surface. The `EdgeHug` / `EdgeGutter` pair demonstrates it; every other story centers its trigger so the popover keeps real clearance.

Current confirms with a bare "Confirm" while a reference check is still spinning inside the message. Recommended waits for the count, then labels the confirm with the concrete consequence.

> **Why it matters:** do not offer the confirm while a reference check is still spinning. A bare "Confirm" gives a destructive action too little friction, and confirming before the count resolves lets an editor delete blind. Wait for the number, then name the consequence right on the button, "Delete (3 refs)" rather than "Confirm".

The page closes _in context_: a document list of authors with a per-row delete, the confirm popover anchored beside whichever row the editor clicked, the lightweight inline confirm in the seat it was built for.
