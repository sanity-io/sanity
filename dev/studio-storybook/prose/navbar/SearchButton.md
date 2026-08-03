---
source: stories/navbar/SearchButton.stories.tsx
title: 'Acme Content'
blocks: 3
roundtrip: true
sourceHash: 339012c342bf6481
---

<!-- @component -->

The navbar trigger that opens global search is deliberately just a button: its entire props interface is a single click handler. It holds no search state, announces the affordance and its keyboard shortcut, and hands off.

|        |                                                                             |
| ------ | --------------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/studio/components/navbar/search/SearchButton.tsx` |
| Tier   | CHROME. It is the doorway to search, not the search itself                  |

> **Why it matters:** the trigger and the machinery are cleanly separable, and this page shows both sides. On its own the button is a button, which is the honest thing to show. Wired up, it opens the real subsystem. Looking only at the first story leads to concluding the component does nothing, which is right about the component and wrong about the seam.

<!-- @story Default -->

The button by itself, with nothing behind it. Hover it for the tooltip and its hotkey. This is the whole component: everything else about search lives elsewhere.

<!-- @story InContext -->

The trigger wired to the subsystem it exists for. Click it and the real `SearchPopover` opens against the fixture Content Lake: type a query and the results are genuinely searched. This is the story that shows what the button is for, and it is the composition `StudioNavbar` itself performs.
