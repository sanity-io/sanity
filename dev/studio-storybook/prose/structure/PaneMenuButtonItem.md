---
source: stories/structure/PaneMenuButtonItem.stories.tsx
title: 'Document Pane/Menu Button Item'
blocks: 1
roundtrip: true
sourceHash: b9dcd78f089a49da
---

<!-- @component -->

Two sibling renderers, forty lines apart in the same file, disagree about what to do when a menu row is both selected and carries its own trailing icon. One drops the custom icon; the other drops the checkmark. Same menu, same visual row, opposite resolution.

|          |                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/structure/components/pane/PaneMenuButtonItem.tsx`                                                    |
| Tier     | SERVICE. It draws almost nothing itself. It reads the node type and recurses, ending at one of two sibling leaf renderers |
| Audit    | 🟡 needs-work (`menu-item`, `selection-indicator`)                                                                        |
| Patterns | `menu-item` · `selection-indicator`                                                                                       |

Every row in a document pane context menu passes through here. The structure builder describes a tree of items, groups and dividers; this component turns that description into menu rows, calling itself for each child.

It is genuinely recursive: a group renders this component for each of its children, so a three-level menu is three levels of itself. The stories below mount it directly inside a bare menu, because the recursion is the interesting part and a real pane would bury it.

The five returns, quoted:

| Line | Condition                          | Renders                                       |
| ---- | ---------------------------------- | --------------------------------------------- |
| 27   | `node.type === "divider"`          | `<MenuDivider />`                             |
| 34   | group with `children.length === 0` | `null`                                        |
| 38   | group, `expanded`                  | the children inlined, under an optional label |
| 58   | group, not expanded                | a `MenuGroup` that opens a submenu            |
| 80   | anything else (an item)            | hands off to a resolver                       |

The resolver then splits once more, on whether the item carries an intent: an item with an intent becomes a real link with an href, and everything else becomes a plain menu row. Two components, visually identical by design, sitting in the same menu.

> **Why it matters:** the plain-row renderer lets a custom trailing icon win and drops the checkmark; the intent-row renderer lets the checkmark win and drops the custom icon. An author who sets a trailing icon on a selected item gets a different result depending on a property that has nothing to do with icons, whether the row happens to navigate. The selection-indicator-conflict story puts the two side by side with identical node descriptions, so the divergence is visible rather than described.

A second, smaller asymmetry: the plain-row renderer carries a test id built from the item's title. The intent-row renderer carries no test id at all. Every intent-driven row in every pane menu, which is to say every row that actually navigates somewhere, is unaddressable from a test that selects by test id.

On the divider that follows a group: the caller passes that flag in, and three of the five returns begin by conditionally rendering a divider. The component never computes it for itself at the top level; a group computes it for its own children by checking whether the previous sibling was itself a group. So a divider appears after a group ends, and the first child of a menu never gets one.
