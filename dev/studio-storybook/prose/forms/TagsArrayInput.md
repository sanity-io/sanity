---
source: stories/forms/TagsArrayInput.stories.tsx
title: 'Article'
blocks: 1
roundtrip: true
sourceHash: aa57858a3519ccb0
---

<!-- @component -->

The one thing an editor needs to know, press Enter to add each tag, lives only in the field’s description prose, not on the control itself. Nothing in the chip box tells them how to add the first tag.

|          |                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/TagsArrayInput.tsx`, Studio-only (no design-system equivalent)                                                                                                                                                                                                                                                                                                  |
| Tier     | SERVICE. The tags field: an array-of-strings input rendered as removable chips. It wraps Studio’s own `TagInput` component (not a bare `@sanity/ui` primitive), maps the stored `string[]` to and from `TagInput`’s `{value}[]` shape, strips stega metadata from pasted text, emits `set` / `unset` patches, and wraps its content in a `ChangeIndicator`. Composed with the real `FormField` chrome |
| Audit    | 🔴 needs-work (`error-messages`, `input-hints`, `schema-driven-forms`). Like every field, validation surfaces only through the `FormField` header’s hover-only icon; the chip control itself gives no at-rest error message. The "press Enter to add" affordance lives in the description prose (`input-hints`), not the control                                                                      |
| Patterns | `error-messages` · `input-hints` · `schema-driven-forms`                                                                                                                                                                                                                                                                                                                                              |

The tags field: type a label, press Enter, and it becomes a removable chip; the whole set is stored as a plain array of strings.

When you want a handful of free-form labels on a document, topics, keywords, categories, this renders an array of strings as friendly removable chips. Type, press Enter, and each entry becomes a chip you can pop off with a click. It even strips stega metadata out of pasted text, so copy-pasting from a Visual Editing session does not smuggle invisible markers into your tags.

It wraps Studio’s own `TagInput` (not a bare `@sanity/ui` primitive), maps the stored `string[]` to and from `TagInput`’s `{value}[]` shape, emits `set` / `unset` patches, and wraps its content in a `ChangeIndicator` inside the real `FormField` chrome. Mounted for real via `fieldTestHarness`; the shared form-legibility fixes live on **StringInput**.

> **Why it matters:** the one thing an editor needs to know, _press Enter to add each tag_, lives only in the field’s description prose, not on the control itself (`input-hints`). Nothing in the chip box tells them how to add the first tag.

The page closes **in context**: the Tags field on the _Anna Karenina_ book, three real chips you can pop off, beneath the document title.
