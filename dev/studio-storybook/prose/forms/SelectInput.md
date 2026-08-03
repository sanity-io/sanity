---
source: stories/forms/SelectInput.stories.tsx
title: 'Article'
blocks: 1
roundtrip: true
sourceHash: fd414d5fd5bc4b8e
---

<!-- @component -->

Enumerated choice is where Studio is strong, and the weak spot is entirely error legibility: an invalid select only tints critical and shows a hover-only icon, so the actual message stays hidden until an editor thinks to hover it.

|          |                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/SelectInput.tsx`, Studio-only (no design-system equivalent)                                                                                                                                                                                                                                                                                                                                      |
| Tier     | SERVICE. The enumerated-choice field. It wraps `@sanity/ui`’s `Select` (dropdown) or a `Radio` group (`options.layout: "radio"`), maps the schema’s `options.list` of titled values to option elements, prepends an empty item, tones the control critical on error, emits `set` / `unset` patches, and, in the radio layout, adds a clear button. Wraps its content in a `ChangeIndicator`. Composed with the real `FormField` chrome |
| Audit    | 🔴 needs-work (`error-messages`, `schema-driven-forms`). An invalid select only tints critical and shows the header’s hover-only validation icon; the message stays behind the hover. Its enumerated-choice model is otherwise a solid `schema-driven-forms` example                                                                                                                                                                   |
| Patterns | `error-messages` · `schema-driven-forms`                                                                                                                                                                                                                                                                                                                                                                                               |

The pick-one field, a dropdown or a radio group, for choosing a single value from a fixed list defined in the schema, like a document’s status.

When a field should hold exactly one of a known set of values, draft/review/published, a visibility level, a category, this is the field. Declare the choices as `options.list` in your schema and it renders them as a dropdown, or as a radio group if you set `options.layout: "radio"`. It is a clean example of schema-driven forms: the model declares the choices, the input renders and validates them, and picking one emits the same `set` patch the real document form applies.

It wraps `@sanity/ui`’s `Select` (or a `Radio` group), prepends an empty item, tones the control critical on error, and, in radio layout, adds a clear button, all inside a `ChangeIndicator` and the real `FormField` chrome. Mounted for real via `fieldTestHarness`; the shared form-legibility fixes live on **StringInput**.

> **Why it matters:** enumerated choice is where Studio is strong; the weak spot is error _legibility_: an invalid select only tints critical and shows a hover-only icon, so the actual message stays hidden until you hover. The inline fix is the one shown on **StringInput**.

The page closes **in context**: the workflow controls of the _Anna Karenina_ article, its editorial status dropdown above the visibility radio group, both live.
