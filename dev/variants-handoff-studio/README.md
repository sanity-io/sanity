# Content Variants Handoff Studio

The engineering reference for the Content Variants open beta. One fixed design, no Design options window, no remote.
Scope: `docs/initiatives/curation-perspective-selector/OPEN-BETA-HANDOFF-SCOPE.md` (T1 to T4).

```
pnpm install                                          # from the repo root
pnpm --filter sanity-variants-handoff-studio dev      # http://localhost:3351
```

Project `ppsg7ml5`, dataset `variants-2-0` (private). The origin you serve from must be a CORS origin of the project.

| Change             | What it is                                                                                                                                              | Where |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| T1 Perspective bar | The stock state control plus one Variants control. The control is named by its dimension ("Audience") until a value is chosen. No bar under the navbar. | `c1/` |
| T2 Document pills  | Variants group, divider, Published, Draft, Releases group (counts releases). Titles, never ids. The inventory opens from the pane header's own button.  | `c2/` |
| T3 Document list   | The documents icon on each row; hover opens a read-only popover; a click opens the document with its inventory.                                         | `c3/` |
| T4 Inventory       | Andrej's inventory panel in the inspector, without its toolbar (a scoped style hides it; his files are not edited).                                     | `c4/` |

A row in the inventory changes the GLOBAL perspective (an open beta limitation). The design is pinned in `options/registry.ts` (`fixed`).
The exploration with every option is `dev/variants-2-0-studio` on branch `explorations/variants-2-0-studio`.

`seed/` and `PERMUTATIONS.md` keep the test data.
