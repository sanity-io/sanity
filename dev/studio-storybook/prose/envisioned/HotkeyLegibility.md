---
source: stories/envisioned/HotkeyLegibility.stories.tsx
title: 'Envisioned/Hotkey Legibility'
blocks: 1
roundtrip: true
sourceHash: 3b9502a3402626e1
---

<!-- @component -->

A hotkey chip is the one piece of text whose entire job is to be absorbed peripherally, glanced at inside a tooltip while the eye is on the control, yet today it is set smaller than body copy at the exact moment tooltip typography compounds against it.

|          |                                                                                                                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anchor   | `Actions & Commands/Hotkeys` (the keycap renderer and its common-shortcuts gallery) and `Overlays & Navigation/Tooltip`, the host surface where keycaps do most of their living, at their smallest |
| Evidence | design law 8 (typography has a floor); audit `minimalistic` and `keyboard-only`, a keyboard map no one can read at arm’s length is a keyboard map that doesn’t teach                               |
| Patterns | `keyboard-only` · `minimalistic`                                                                                                                                                                   |

Tooltip typography compounds (a small label, a keycap sized relative to that), and the glyphs that matter most, the command and option symbols, the difference between K and X, are precisely the ones that die first under 11px. Keycaps deserve a floor: a minimum rendered size that tooltips must respect no matter what their label text does, the same way the Dialog measure work capped prose instead of hoping authors would.

> **Why it matters:** the size ramp walks the real `Hotkeys` component down from body size with the floor drawn as a line in the track. Step back a metre and read it again, wherever your reading stops is the argument, self-administered.
