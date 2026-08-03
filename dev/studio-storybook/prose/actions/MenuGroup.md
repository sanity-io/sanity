---
source: stories/actions/MenuGroup.stories.tsx
title: 'Actions & Commands/MenuGroup'
blocks: 2
roundtrip: true
sourceHash: ff31ebb47501dff2
---

<!-- @component -->

Menus grow. Every feature that ships adds a row, nobody ever removes one, and eventually the document menu is a column of fifteen things an editor reads past to reach the two they came for.

|                 |                                                                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source          | `packages/sanity/src/ui-components/menuGroup/MenuGroup.tsx`, the Studio shadow of `@sanity/ui` MenuGroup                                                                    |
| Tier            | CHROME. A nested-submenu trigger, commodity behaviour. The shadow only pins `fontSize` / `padding` for layout consistency and adds an optional tooltip                      |
| Audit           | ⚪ not-audited as a unit. It is the grouping primitive that _resolves_ the `hicks-law` / `choice-overload` finding on flat menus; see `MenuButton › RecommendedGroupedMenu` |
| Required config | `popover={{placement: "right-start", fallbackPlacements: ["left-start", "bottom", "top"]}}`. There is no sensible default, and no default is supplied                       |
| Patterns        | `smart-menu-items` · `hicks-law`                                                                                                                                            |

Menus grow. Every feature that ships adds a row, nobody ever removes one, and eventually the document menu is a column of fifteen things an editor reads past to reach the two they came for. `MenuGroup` is the way out. Drop one among your `MenuItem`s and its children live a level deeper, so the top of the menu stays short and scannable while Export, Advanced and Danger zone wait behind a hover.

Open any menu below and hover a group to expand it. Groups nest, as the `Nested` story shows, but two levels is the practical limit: past that a person stops knowing where they are in the tree, and the chunking that was meant to reduce the search cost starts adding to it.

> **Why it matters:** placement is not optional here. `@sanity/ui` `MenuGroup` ships _no_ default flyout placement, so an unconfigured group inherits `Popover`’s `placement="bottom"` and opens its flyout directly below its own trigger, hiding the items underneath. Pass the right-first shape in the table above, with `left-start` leading the fallbacks so a starved edge flips sideways rather than stacking. Every story here does, and so does every Studio call site.

The page closes _in context_: the "Anna Karenina" document-actions menu with its long tail chunked into Publishing, Translate and a critical Danger zone group.

<!-- @story Nested -->

Groups nest: keep the tree shallow (two levels is usually the practical limit).
