---
source: stories/envisioned/UndoTimeline.stories.tsx
title: 'Dune'
blocks: 1
roundtrip: true
sourceHash: 51949ff04854cacb
---

<!-- @component -->

Ctrl+Z is a fine verb and a terrible map: it answers step back once but never how far back can I go, what would three steps back land on, or which of these steps was the one that broke it. Studio is the one product where the depth already exists, every keystroke is history, which makes the missing affordance pure surface debt.

|          |                                                                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anchor   | `Forms & Input/StringInput` (the committed-field editing loop these steps come from) and `Document Status/Document Status`, the document-level surface a history control belongs beside. Undo in Studio exists but is keyboard-only, with no UI control |
| Evidence | audit `multilevel-undo` (ch8: undo is keyboard-only, no UI control); researcher’s brief §3, undo depth is one of the sixteen convergent failures; §6’s parity trap warns the other direction, wire the depth first, then the affordance                 |
| Patterns | `multilevel-undo` · `safe-exploration`                                                                                                                                                                                                                  |

The envisioned control is an undo timeline: the history stack as a visible, labelled, clickable list, each entry names its change in editorial terms, and clicking any depth restores the document to that point in one act. Steps above the jump target stay in the list, greyed, a redo lane, not a destroyed future, so exploration of history is itself safe.

> **Why it matters:** the strip above the form counts the reachable past. Make a few edits, then click three steps back, then click forward again. The counter and the greyed redo lane are the falsifiable difference between this and a blind Ctrl+Z, depth you can see before spending it. Today’s Studio ships the same depth with a readout of zero.
