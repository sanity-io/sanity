---
source: stories/forms/PreviewReferenceValue.stories.tsx
title: 'Author'
blocks: 1
roundtrip: true
sourceHash: 3baffbeb961544c7
---

<!-- @component -->

What a person actually sees in every reference field has six possible shapes, and five of them are failures, two of which render identically and differ only in a tooltip a reader has to think to hover.

|          |                                                                                                                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/ReferenceInput/PreviewReferenceValue.tsx`                                                                                                                   |
| Tier     | CORE. It is what a person actually sees in every reference field, and five of its six outcomes are failures                                                                                       |
| Audit    | 🟡 needs-work (`reference-integrity`, `error-recovery`). Two of the six outcomes are indistinguishable on screen, and the one piece of information that separates them is only reachable on hover |
| Patterns | `reference-integrity` · `error-recovery`                                                                                                                                                          |
| Returns  | 6 statements, 5 distinct appearances (two paths both render `InvalidType`)                                                                                                                        |

The renderer inside every reference field. `ReferenceInput` decides what a reference means; this decides what you look at once it has. This page mounts the component **directly**, one story per return statement, because the whole argument is what the six look like beside each other and the input can only ever be in one of them at a time. `referenceInfo` is the component's own prop, so the fixtures here are inputs rather than a fabricated data source: this is a Studio-lane page, not a Stubbed one.

**What reading it turned up.** The component has six `return` statements and produces **five distinct appearances**, because two different code paths both render `InvalidType`. A state count is a ceiling on how many pictures a component can show, never a count of how many it does.

> **Why it matters:** the `NOT_FOUND` and `PERMISSION_DENIED` branches share one return and render **identically**: the same muted "Document unavailable" text and the same help icon. Only the tooltip tells them apart, and the difference decides whether a person should go fix their own content or go ask an administrator. It is not a bug and no test would catch it. It is visible only when the states are put next to each other, which is what this page does.

Fixture universe is the shared author/book one from `lib/mockDocumentPreviewStore.ts`, so the resolved story runs the real `prepareForPreview` pipeline rather than a hand-drawn card.
