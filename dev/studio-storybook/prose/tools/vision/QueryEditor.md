---
source: stories/tools/vision/QueryEditor.stories.tsx
title: 'Lists & Data/Vision/QueryEditor'
blocks: 1
roundtrip: true
sourceHash: c42ca5840e6d3034
---

<!-- @component -->

QueryEditor has no inline diagnostics layer: a bad query prints no underline, no gutter marker, nothing at all, until it is run. That gap is deliberate, but it means a typo hides in plain sight until execution.

|        |                                                                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source | `packages/@sanity/vision/src/codemirror/VisionCodeMirror`, mounted with `groqExtensions`; the top-left pane of the Vision tool                         |
| Tier   | SERVICE. CodeMirror 6, monospace, real GROQ syntax highlighting, tool font at `Code size 1` (13px, `fonts.code.sizes[1]`, set in `useCodemirrorTheme`) |
| Audit  | 🔴 needs-work. No inline diagnostics: a typo is invisible until Fetch surfaces it as a critical result on the Errors page (design law 5, deliberate)   |

It is a CodeMirror 6 editor: monospace, real GROQ syntax highlighting (keywords, strings, numbers, the projection braces). A syntax error is only reported after Fetch, as a critical state in the result pane.

> **Why it matters:** unlike the params pane one tab over, nothing here flags a bad query before Fetch. The gap is deliberate, since validating a query mid-type would be premature, but it means a typo waits silently for execution to reveal it.
