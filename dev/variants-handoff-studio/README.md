# Content Variants Handoff Studio

The engineering reference for the Content Variants open beta. One fixed design, no Design options window, no remote.
Scope: `docs/initiatives/curation-perspective-selector/OPEN-BETA-HANDOFF-SCOPE.md` (T1 to T4).

```
pnpm install                                          # from the repo root
pnpm --filter sanity-variants-handoff-studio dev      # http://localhost:3333
```

Project `ppsg7ml5`, dataset `variants-2-0` (private). The origin you serve from must be a CORS origin of the project; `http://localhost:3333` is one,
so the studio serves there (stop any other studio on 3333 first).

| Change             | What it is                                                                                                                                                                                                                                                                                                                                                                   | Where |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| T1 Perspective bar | The stock state control plus one Variants control. The control is named by its dimension ("Audience") until a value is chosen. No bar under the navbar.                                                                                                                                                                                                                      | `c1/` |
| T2 Document pills  | Variants group, divider, Published, Draft, Releases group (counts releases). Titles, never ids. Every pill has a leading glyph and the stock chip's size. The inventory opens from the pane header's own button.                                                                                                                                                             | `c2/` |
| T3 Document list   | The documents icon on each row; hover opens a read-only popover; a click opens the document with its inventory.                                                                                                                                                                                                                                                              | `c3/` |
| T4 Inventory       | Andrej's inventory panel in the inspector (opens at 430px, resizable 320–540) with Create version: a mode of the toolbar. Three rows (Variant definition, Bundle, Document), each a dropdown; a group's + presets its bundle, never locks it. Scheduled releases are listed but locked. New versions are kept in memory only (nothing is written). His files are not edited. | `c4/` |

A row in the inventory changes the GLOBAL perspective (an open beta limitation). The design is pinned in `options/registry.ts` (`fixed`).
The exploration with every option is `dev/variants-2-0-studio` on branch `explorations/variants-2-0-studio`.

`seed/` and `PERMUTATIONS.md` keep the test data.

## Validate it

| Document                                               | What it shows                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Winterhold (`book;book-winterhold`)                    | Variants, Published, Draft and one release (Black Friday, scheduled). T1 Variants menu and its search; T2 pills; T4 Create version with a new address, with an existing one (the i beside the pill, Open existing version), and Black Friday locked (dimmed in the Bundle menu, its group's + disabled). |
| A Field Guide to Small Hours (`book;book-field-guide`) | A version in Autumn catalogue (undecided), an open release: open the inventory, By publish date, press + on Autumn catalogue. The Bundle dropdown is preset to it and still changeable.                                                                                                                  |
| The Quiet Cartographer                                 | The default address (Base · all visitors in Drafts) already exists: Create version opens with the Variant definition menu open and Create disabled until a new address is chosen.                                                                                                                        |
| Book (live edit)                                       | Published only in the T2 pills and in the inventory.                                                                                                                                                                                                                                                     |

Search (T1, T2, T4) ranks titles, then conditions, then IDs (whole or from the start), and names the reason under a non-title match.
