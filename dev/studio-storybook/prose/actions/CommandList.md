---
source: stories/actions/CommandList.stories.tsx
title: 'Anna Karenina'
blocks: 1
roundtrip: true
sourceHash: 89178cd269b5efbd
---

<!-- @component -->

CommandList is mostly why Studio feels fast or slow: arrow keys, Enter, virtualization and jump-by-filter all work in the engine itself. What lets an editor down is what gets fed into the list.

|                |                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source         | `packages/sanity/src/core/components/commandList/CommandList.tsx`, Studio-only (no design-system equivalent)                                                                                                                                     |
| Tier           | SERVICE, and CORE-adjacent. A horizontal capability rather than a single feature: the virtualized, keyboard-navigable ARIA `combobox` / `listbox` engine that global search, `@`-mentions, the new-document picker and faceted filters all mount |
| Audit          | 🔴 needs-work (`command-palette`, `keyboard-only`, `jump-to-item`). The engine itself _holds_. The defect is upstream, in what the surface feeds it                                                                                              |
| Measured       | Cmd+K indexes documents only and invokes no commands: publish, duplicate, deploy and theme are unreachable. Keyboard reach never leaves the local list, and long pickers arrive unchunked with no A to Z jump                                    |
| Virtualization | `LargeVirtualizedList` holds 1,200 rows; only the visible window plus overscan is ever in the DOM                                                                                                                                                |
| Harness        | the active index lives in an internal ref and no `onActiveIndexChange` callback exists, so the stories surface keyboard state through the row `onClick` the list fires on Enter                                                                  |
| Patterns       | `command-palette` · `keyboard-only` · `jump-to-item`                                                                                                                                                                                             |

Every quick list an editor touches runs on it: type into global search, `@`-mention a teammate, pick a type out of a thousand-row set, and the same engine is mounting only the rows on screen, moving the active row with the arrow keys, and activating on Enter. Building a searchable or command-driven surface means composing this rather than writing it, because virtualization and ARIA are already settled.

The stories mount the **real** `CommandList` bare, since it needs only the Sanity UI theme the global decorator already supplies. Each row is a `Card as="button"`, the `a,button` element the list routes keyboard activation through, and `activeItemDataAttr="data-hovered"` makes the Card paint its own active background as focus moves, exactly as `MentionsMenu` and `NewDocumentList` do. The "Last activated" readout on each story is the observable proof that Enter reached the row.

> **Why it matters:** the engine is not the bottleneck. Arrow keys, Enter, virtualization and jump-by-filter all hold, and the `command-palette` gap is entirely in what the surface _feeds_ it. Read `Current` and `Recommended` as one exhibit: the same `CommandList`, one of them handed a mixed command and document index. Fix the input, not the list.

The last story shows it in context: the ⌘K palette an editor opens to jump to a fixture author (Austen, Tolstoy, Lem, Brontë, Woolf). Type, arrow, Enter.
