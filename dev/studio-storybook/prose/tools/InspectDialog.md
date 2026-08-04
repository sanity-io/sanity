---
source: stories/tools/InspectDialog.stories.tsx
title: 'A field guide to content modelling'
blocks: 1
roundtrip: true
sourceHash: fe955118373ca657
---

<!-- @component -->

InspectDialog is the escape hatch for seeing the actual document: the system fields, the exact reference, the shape a GROQ query will return, not the friendly form on top of it. It is one menu click away and one click to close.

|          |                                                                                                                                                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/structure/panes/document/inspectDialog/InspectDialog.tsx`, Studio-only (no DS equivalent)                                                                                                                               |
| Tier     | SERVICE. The document JSON inspector: a DS `Dialog` hosting a parsed tree (`@rexxars/react-json-inspector`, searchable) and a raw JSON `Code` view, toggled by a two-tab bar whose selection persists per pane via `useStructureToolSetting` |
| Audit    | 🟢 holds (`editor-api-seam`). Inspect is the positive example: it exposes a document’s developer-facing identity, its raw JSON, system fields, references, from inside the editing UI, on demand, without leaving the document               |
| Patterns | `editor-api-seam`                                                                                                                                                                                                                            |

It hosts two views of the same document: a parsed, searchable tree for hunting a field, and a raw JSON `Code` view for copying the real thing. The tab you last used is remembered per pane.

The story mounts the **real** `InspectDialog` on the studio provider stack (`lib/testProvider.tsx`) over a fixture document, with a minimal document-pane context stub (the dialog only reads `paneKey` + `onInspectClose`). The API is mocked, not the document.

> **Why it matters:** this is the seam done right: the raw document is reachable from _inside_ the form, on demand, and gone again just as fast. Developers get ground truth without leaving the editor, and editors never have to see it unless they go looking.

The last story shows it in context: opened on the "Anna Karenina" draft, the raw JSON behind the book being edited, `_id`, author `_ref` and all.
