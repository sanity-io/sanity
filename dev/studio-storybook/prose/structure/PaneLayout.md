---
source: stories/structure/PaneLayout.stories.tsx
title: 'Book'
blocks: 1
roundtrip: true
sourceHash: 122000333c21ef02
---

<!-- @component -->

No design system ships a master-detail pane stack. This rail is entirely the product's own, which is exactly why its wayfinding gaps have no upstream fix to inherit.

|          |                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source   | `packages/sanity/src/structure/components/pane` (+ `panes/documentList`, `panes/document`). Studio-only, no design-system equivalent                         |
| Tier     | CHROME. Pane-stack navigation is chrome by the decomposition map, but the rail itself was a Carbon 🔴 Gap: no design system ships a master-detail pane stack |
| Audit    | 🔴 needs-work (`pane-stack-navigation`, `breadcrumbs`, `escape-hatch`, `movable-panels`)                                                                     |
| Patterns | `pane-stack-navigation` · `escape-hatch` · `movable-panels`                                                                                                  |

This is the sliding pane stack: the master-detail rail where clicking a list item opens a new pane to the right instead of replacing the page, and each pane can open the next.

Most of the product's navigation is panes that stack sideways, not pages that swap each other out: click a book in the list and its document pane slides in beside the list; click something in that pane and a third slides in after it. It is one of the most recognisable things about working here, and, as the Carbon audit found, one that no design system had a pattern for, so every pixel of the rail is the product's own invention.

These stories mount the real structure machinery: a structure tool provider, the pane layout, a pane router provider per pane, and the real document-list and document pane components. The router is the real structure router mounted statefully, so clicking a list item truly navigates: a document pane opens to the right, back and close links work, and the pane stack re-derives from router state. Pane nodes come from the real structure builder, so the header sort and layout menus are the auto-derived ones.

Audit verdicts against current code, verified in source:

<details><summary><b>Breadcrumbs: a breadcrumb component exists but only renders in focus mode.</b></summary>

The document panel header renders it only when the pane is maximized; in the normal stack each header shows only its local title. The audit finding stands.

</details>

<details><summary><b>Escape hatch: Escape is a no-op in the stack.</b></summary>

The only global key handler in the structure tool is the save-shortcut toast. Addressed would be: Escape steps back one pane, closing the last group, matching the modal-dismiss instinct the pattern names.

</details>

<details><summary><b>Movable panels: partially better than the audit note suggested.</b></summary>

The divider has a 9px hit area, a resize cursor, and a faint hover tint. Still no visible handle glyph, no keyboard resize, and panes cannot be reordered.

</details>

Mock seam, stated honestly: the fixture client filters by type and re-sorts by the query's order clause, but does not evaluate search terms; typing in the list search returns all fixtures. Search-behaviour findings belong to other stories.

> **Why it matters:** every affordance here gets built here or it does not exist. No breadcrumb trail outside focus mode, Escape doing nothing, a 1px divider with no handle, none of these have an upstream fix to inherit, because no design system ships this pattern at all.
