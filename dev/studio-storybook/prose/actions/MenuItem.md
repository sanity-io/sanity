---
source: stories/actions/MenuItem.stories.tsx
title: 'Actions & Commands/MenuItem'
blocks: 2
roundtrip: true
sourceHash: b0df1a21c735a274
---

<!-- @component -->

MenuItem is the one row every menu in Studio is built from. It restricts more than the primitive underneath it: the set of affordances is fixed rather than open, so menus written years apart by people who never met still line up down the page.

|             |                                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source      | `packages/sanity/src/ui-components/menuItem/MenuItem.tsx`, the Studio shadow of `@sanity/ui` MenuItem                                                                    |
| Tier        | CHROME. A menu row is commodity. The shadow blocks `children`, which is what keeps rows single-line and legible                                                          |
| Affordances | leading icon, trailing icon, hotkey hint, badge, subtitle, and a 25×25 preview slot. That list is the whole permitted set                                                |
| Audit       | ⚪ not-audited as a unit. It is the row primitive the `MenuButton` illustrations compose; `tone` and `selected` are where `similarity` can be answered at the item level |
| Patterns    | `smart-menu-items` · `similarity`                                                                                                                                        |

Give it text and it is a plain action; add an icon, a hotkey, a badge or a preview and it grows to fit without anyone laying anything out.

Each story renders its rows inside a bare `@sanity/ui` `Menu`, so every state is visible without opening a popover first.

> **Why it matters:** the block on arbitrary `children` is the feature, not a limitation to work around. If you find yourself trying to fit a multi-line layout into a menu item, the component is telling you something: that uniform row is what makes a menu scannable, and a menu that gives it up stops being one.

The last story shows it in context: a document-actions menu for the "Anna Karenina" book, assembled row by row from MenuItems.

<!-- @story WithTooltip -->

A disabled item cannot receive hover events itself, so the shadow wraps it in a span to keep the tooltip working. That is what makes it possible to explain _why_ an action is unavailable, rather than leaving a dead row on the page.
