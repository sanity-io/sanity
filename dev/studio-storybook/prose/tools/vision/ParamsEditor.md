---
source: stories/tools/vision/ParamsEditor.stories.tsx
title: 'Lists & Data/Vision/ParamsEditor'
blocks: 1
roundtrip: true
sourceHash: 07534adecf46b9b6
---

<!-- @component -->

Unlike the query editor, the params pane validates continuously: a parse error flips the whole card critical and disables Fetch, so a malformed object can never reach the API. The catch is where the message lives, inside an icon tooltip, out of reach for anyone navigating by keyboard.

|        |                                                                                                                                                                                  |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source | `packages/@sanity/vision/src/components/ParamsEditor`, the pane directly under the query editor: a JSON object of the `$params` a GROQ query references (`$minYear`, `$slug`, …) |
| Tier   | SERVICE. The same CodeMirror editor as the query pane, loaded with `paramsExtensions` (JSON, not GROQ)                                                                           |
| Audit  | 🔴 needs-work. The parse-error message lives only in an icon tooltip, reveal-on-hover, unreachable by keyboard                                                                   |

It is the same CodeMirror editor as the query pane, loaded with `paramsExtensions` (JSON, not GROQ). Unlike the query editor it does validate inline: on a parse error the whole card flips to the critical tone and an error icon appears next to the "Params" label, carrying the parser message in its tooltip. This is the design-law-5 model done right: the params are parsed continuously, but the signal is a quiet icon, not a blocking wall.

> **Why it matters:** a malformed params object can never reach the API, because Fetch stays disabled while the card reads critical. But the only explanation lives in a tooltip a mouse must hover, so a keyboard-only author sees red and no reason why.
