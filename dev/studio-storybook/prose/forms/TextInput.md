---
source: stories/forms/TextInput.stories.tsx
title: 'Article'
blocks: 1
roundtrip: true
sourceHash: d659c0809757ad4c
---

<!-- @component -->

Everything that ails StringInput ails this field too: hidden error messages, unmarked requiredness, publish-only validation, because both ride the same `FormField` chrome. Fix the chrome once and every string-like field improves together.

|          |                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/TextInput.tsx`, Studio-only (no design-system equivalent)                                                                                                                                                                                                                                                                                                                                                                       |
| Tier     | SERVICE. The multi-line string field. It wraps `@sanity/ui`’s `TextArea`, adds vertical-only resize, applies the schema’s `rows` (default 10), the placeholder, and the `validationError` → `customValidity` binding, and is composed with the real `FormField` chrome                                                                                                                                                                                                |
| Audit    | 🔴 needs-work (`error-messages`, `inline-validation-timing`, `required-optional-marking`, `schema-driven-forms`). TextInput inherits the whole form-legibility trio through the shared `FormField` chrome: the error message hides behind the header’s hover tooltip while the field only tints, requiredness is never marked, and validation defers to publish. The Current/Recommended pairs are built once on **StringInput**; this field renders them identically |
| Patterns | `error-messages` · `inline-validation-timing` · `required-optional-marking` · `schema-driven-forms`                                                                                                                                                                                                                                                                                                                                                                   |

The multi-line text field: a resizable textarea for longer plain-text copy like a summary or a body blurb.

When one line is not enough but you do not need rich formatting, this is the field: a plain multi-line textarea for summaries, descriptions, longer notes. It honours the schema’s `rows` for its starting height (default 10) and resizes vertically as the copy grows, never sideways, so it cannot break your form layout.

It wraps `@sanity/ui`’s `TextArea`, applies the placeholder and the `validationError` → `customValidity` binding, and composes with the real `FormField` chrome. Mounted for real via `fieldTestHarness`. The validation-error story shows the shipped composition unmodified; hover the header icon to reveal the message that should be inline.

> **Why it matters:** everything that ails **StringInput** ails this field too: hidden error messages, unmarked requiredness, publish-only validation, because both ride the same `FormField` chrome. Fix the chrome once and every string-like field improves together.

The page closes **in context**: the Body field in a real document pane, writing the copy of the _Anna Karenina_ book, beneath its title header.
