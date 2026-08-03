---
source: stories/forms/ReferenceInput.stories.tsx
title: 'Author'
blocks: 1
roundtrip: true
sourceHash: 854ef1fd2150e4a5
---

<!-- @component -->

Pressing "Create new" mints and binds a draft to the parent document before the editor types anything, so cancelling leaves a dangling reference plus an orphan draft. It is the single most-cited defect across the 8-product benchmark, and every Current-versus-Recommended pair on this page circles it.

|          |                                                                                                                                                                                                                                                                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/ReferenceInput/ReferenceInput.tsx`, Studio-only (no design-system equivalent)                                                                                                                                                                                                                                           |
| Tier     | CORE. The schema-driven reference field is load-bearing content-model machinery: it is how relational integrity is authored, and no design system ships an equivalent                                                                                                                                                                                         |
| Audit    | 🔴 needs-work (`reference-integrity`, `autocompletion`, `safe-exploration`). "Create…" mints **and binds** a draft before any user input, so cancelling leaves a dangling reference plus an orphan draft (the single most-cited defect of the 8-product benchmark); and a no-match search query returns _unrelated_ authors instead of an honest "No results" |
| Patterns | `reference-integrity` · `autocompletion` · `safe-exploration`                                                                                                                                                                                                                                                                                                 |

The field that links one document to another, pick an existing author for a book, or spin up a new one inline, and the machinery that keeps those links honest.

The stories mount the **real** `ReferenceInput` on the full studio provider stack (`lib/testProvider.tsx`) with a fixture-backed `DocumentPreviewStore` (`lib/mockDocumentPreviewStore.ts`): availability, `_type` resolution, publish-status probing and the `prepareForPreview` pipeline all execute for real against an author/book fixture universe. Search is a story-supplied observable, which is exactly the seam the `autocompletion` defect lives in.

Harness notes: most stories mount the input bare (no `FormBuilder`), so document-level chrome (change bars, presence avatars) is out of scope there, and the original create-flow pair narrates the child pane. The **"rendered" create-flow pair** instead runs the input inside a live `FormBuilder` (`lib/formBuilderHarness.tsx`) with a second live author form as the child pane, so the mint-and-bind sequence and its dangling-ref consequence render for real. The mock store has no live listener, so mutation stories remount to re-read.

Re-verified findings from the previous build (all still current on this branch): `getReferenceInfo` and `editReferenceLinkComponent` exist on `ReferenceInputProps` but are dead, the component resolves both via hooks/context (`useDocumentPreviewStore`, `ReferenceInputOptions`); without `ReferenceInputOptionsProvider` supplying `EditReferenceLinkComponent` the resolved-value preview card silently renders null; the router must be `route.intents(…)` or the "Open in new tab" link throws; `onPathFocus` is required with no default, the input crashes on focus without it.

> **Why it matters:** pressing "Create new" mints **and binds** a draft to the parent document before the editor types anything, so cancelling leaves a dangling reference plus an orphan draft. It is the single most-cited defect across the 8-product benchmark, and every "Current vs Recommended" pair on this page circles it.
