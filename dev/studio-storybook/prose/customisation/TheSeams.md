---
source: stories/customisation/TheSeams.stories.tsx
title: 'Customisation/The Seams'
blocks: 4
roundtrip: true
sourceHash: a6e350f0b117d49e
---

<!-- @component -->

Sanity has two working customisation shapes, and mistaking one for the other is the most common way to get stuck. This is the map: every point at which a Sanity Studio can be reshaped, what each one controls, and which shape it has.

|          |                                                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Source   | every customisation seam in Studio, verified against `picks.ts` and the form/definition-extension types rather than recalled |
| Tier     | SERVICE                                                                                                                      |
| Coverage | 19 seams across four shapes: renderDefault, description, whole surface, dead                                                 |

`renderDefault` seams hand you the default component as a prop and ask for JSX back. You are not given an empty slot; you are given the thing Studio would have rendered. So the normal move is to decorate, wrap the default and add to it, and Studio's own components stay the substrate of your customisation. This is by far the larger group.

Description seams, `document.actions` and `document.badges`, do the opposite. You return data, not markup, and Studio renders it. There is no `renderDefault` to wrap; the equivalent move is to call the thing you are extending and spread its description. That shape exists because one action must render as a button, a menu row and a palette entry, and should look native in all three without the author knowing which context it landed in.

Whole-surface seams, tools, structure, Portable Text plugins, are neither. You are building something new rather than altering something existing.

And one dead row, which is not a fourth shape so much as a warning. `studio.components.logo` is still declared on both public interfaces and still carries a deprecation notice pointing at workspace `icon`, but nothing picks it and nothing consumes it. Registering it has no effect and produces no error. Ledger #61.

A note on where this list comes from: the studio rows are read from `picks.ts` rather than from the config types, because the types over-report in one place and under-report in another. A seam exists when something picks it. The public type is not the inventory.

Every page in this chapter is measured against a default that the chapters above already story. The docs already say customisation is possible; this chapter shows what each choice costs, side by side on the same document.

> **Why it matters:** skip `renderDefault` on a renderDefault seam and you inherit nothing. Validation, presence, change indicators, and read-only handling all stop, because they were the default's doing, not something the seam itself provides.

<!-- @story AllSeams -->

The full inventory, read from the pick functions and the definition extensions rather than recalled. Read the badges first: the shape tells you which move to reach for before you read what the seam controls, and one badge tells you not to bother.

<!-- @story ByShape -->

The same inventory, sorted by the distinction that decides how you write the code. The large majority hand you `renderDefault`. That is where "decorate, do not replace" comes from, and why the two description seams surprise people when they turn out to have no default to delegate to.

Read `Customisation/The Middleware Chain` alongside this, because it qualifies the whole group: `renderDefault` means _the next registrant down_, not _Sanity's component_, and on a studio with plugins installed those are different things.

<!-- @story Coverage -->

Honest state of the chapter, regenerated from the table above rather than maintained by hand.

The form seams are now worked end to end: `input`, `field`, `item`, `preview`, and Portable Text across three pages. What remains has no comparison page yet: the studio chrome seams (`navbar`, `logo`, `toolMenu`, `layout`, `unstable_layout`), whose defaults are storied in `Navbar & Shell` but never set against a customised version, and the two whole-surface seams, which are less a customisation than a construction and may be better served by the chapters that already story them.
