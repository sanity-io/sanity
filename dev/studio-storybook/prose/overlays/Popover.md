---
source: stories/overlays/Popover.stories.tsx
title: 'Overlays & Navigation/Popover'
blocks: 1
roundtrip: true
sourceHash: 8ee16089458aba12
---

<!-- @component -->

Almost every floating thing in Studio, a dropdown menu, a hover card, an inline colour picker, sits on this one component underneath, and the audit finding is what happens in the gap before its content is ready to paint.

|          |                                                                                                                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/ui-components/popover/Popover.tsx`, Studio shadow of `@sanity/ui` `Popover`                                                                                                         |
| Tier     | SERVICE. Deliberately thin: the only change from the primitive is defaulting `animate` to `true`, so every Studio popover animates unless a nested popover opts out to avoid `AnimatePresence` conflicts |
| Audit    | 🔴 needs-work (`instant-gratification`). Popovers can flash empty for ~1s before their content paints; the related `hover-popup-tools` behaviour itself holds                                            |
| Patterns | `hover-popup-tools` · `instant-gratification`                                                                                                                                                            |

You get the full primitive surface and consistent motion for free. Because the shadow adds nothing but the `animate` default, its full prop surface is `@sanity/ui` `Popover`: `content`, `placement`, `fallbackPlacements`, `constrainSize`, `preventOverflow`, `portal`, and a child (or `referenceElement`) as the anchor.

Current reproduces the empty flash, an open popover with no content. Recommended paints skeleton structure immediately so the surface never reads as blank.

> **Why it matters:** a popover can open before its content is ready and flash an empty box for ~1s, the instant-gratification finding. Paint skeleton structure the instant it opens so the surface reads as content loading here, never as a blank void.

The page closes _in context_: a document pane header for the book _Anna Karenina_ whose toolbar button opens a Popover of the document's info, the anchored-panel pattern that menus and info cards are all built on.
