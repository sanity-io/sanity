---
source: stories/envisioned/CommandPaletteConsole.stories.tsx
title: 'Publish document'
blocks: 1
roundtrip: true
sourceHash: 69c80012e378ec27
---

<!-- @component -->

Three design moves distinguish a console from a search box, and all three run live here on the real `CommandList`: an empty query surfaces commands and documents interleaved by relevance, and every command teaches its own shortcut.

|          |                                                                                                                                                                                                                                                                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anchor   | `Actions & Commands/CommandList`, the Current / Recommended pair. Current proves Cmd+K indexes documents only; Recommended proves the engine happily renders a mixed index. This story is the step past Recommended: what Cmd+K becomes when it is designed as a console, not a patched search box                                                               |
| Evidence | audit `command-palette` (Cmd+K indexes documents only, invokes no commands, publish/duplicate/deploy/theme not reachable), `keyboard-only`, `satisficing` (no most-likely-first anywhere); ledger #15 (the command-palette defect is an indexing decision, not an engine limit); ledger #8 (no `onActiveIndexChange`, why the readout observes Enter, not hover) |
| Patterns | `command-palette` · `keyboard-only` · `satisficing`                                                                                                                                                                                                                                                                                                              |

An empty query is the recents shelf, the most-likely-first answer `satisficing` asks for. Commands and documents interleave by relevance rather than living in separate silos, a matching verb outranks a matching noun because typing "pub" means do, not find. Every command teaches its own shortcut, the keycaps are the real `Hotkeys` component, so the palette doubles as the discoverable keyboard map the audit found missing.

> **Why it matters:** the console counts every key pressed from focus to execution. "Publish document" is reachable in four keystrokes and zero for a recent; in today’s Studio it is reachable in no number of keystrokes, because it is not in the index at all. That asymmetry, a finite number versus undefined, is the argument.
