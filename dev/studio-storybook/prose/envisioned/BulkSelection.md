---
source: stories/envisioned/BulkSelection.stories.tsx
title: 'Anna Karenina'
blocks: 1
roundtrip: true
sourceHash: 254f8cf5cc668239
---

<!-- @component -->

A selection model is a tiny grammar, and all its rules matter: click toggles one, shift-click extends a range from the last toggle, and the header well selects and clears all. An editor who cannot select three documents and delete them will not believe a provenance ledger.

|          |                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anchor   | `Actions & Commands/CommandList`, Items with selection, which proves the engine’s `ariaMultiselectable` + `getItemSelected` machinery works today. This story is that machinery given the three things a selection model needs beyond toggling: range gestures, a select-all, and an action bar that spends the selection                                                                                  |
| Evidence | audit `bulk-actions` (ch8: primary lists have no multi-select/checkboxes/bulk ops, one of only five ch8 negatives); researcher’s brief §7, the named keystone of the floor: the sequencing logic is not fix small things first, it is credibility. The brief also notes the selection model was already the overhaul’s P1 keystone, now competitively confirmed by both competitors’ real selection models |
| Patterns | `bulk-actions` · `jakobs-law`                                                                                                                                                                                                                                                                                                                                                                              |

Click toggles one; shift-click extends a range from the last toggle (the gesture every neighbouring product has taught editors to expect, Jakob’s law working for us); "Extend to next click" in the header arms the same range extension without a modifier key; the header well selects and clears all. The modifier-free path is not a fallback, shift-click is a mouse-with-keyboard gesture, and a real selection model must offer range selection to touch editors and assistive input too. The selection then becomes a first-class object with its own surface, the action bar, which states the count, offers the verbs, and is the natural home for the consequence-preview patterns the other Envisioned stories argue for (a bulk delete would speak Reference-Ledger; a bulk publish would speak Validation-Timing).

Verification note, 2026-07-24: the shift-click path reads `event.shiftKey` straight off the row's React click event, the standard seam real browser shift-clicks populate. Automation caveat, twice reproduced (build verification and QA morning sweep): modifier clicks issued through the claude-in-chrome extension arrive at the page with `shiftKey: false`, so extension-driven QA sees toggling instead of ranges; the same handler receives correct ranges when the click event actually carries `shiftKey: true` (verified with dispatched events). Use the armed "Extend to next click" path to demonstrate range selection from any input source. Related engine note: `CommandList` keyboard activation synthesizes an unmodified `.click()`, so modifier-dependent gestures are unreachable from the keyboard through the engine, one more reason the grammar needs the modifier-free rule (see ledger #8).

> **Why it matters:** every selection gesture is counted. Select all ten drafts and press Publish, and the meter shows what the batch cost versus the same outcome one-at-a-time in today's Studio. The ratio grows linearly with the document count, which is exactly why the audit calls this a floor pattern: its absence taxes every list, every day.
