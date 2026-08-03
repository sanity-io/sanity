---
source: stories/forms/NumberInput.stories.tsx
title: 'Review'
blocks: 1
roundtrip: true
sourceHash: 5a3028af071a4206
---

<!-- @component -->

A `type="number"` input will happily change its value when you scroll over it, a classic way to corrupt data without noticing, and NumberInput exists precisely to close that gap while picking the right mobile keyboard along the way.

|           |                                                                                                                                                                                                                                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source    | `packages/sanity/src/core/form/inputs/NumberInput/NumberInput.tsx`, Studio-only (no design-system equivalent)                                                                                                                                                                                                   |
| Tier      | SERVICE. Wraps `@sanity/ui`’s `TextInput` (`type="number"`), composed with the real `FormField` chrome                                                                                                                                                                                                          |
| Audit     | 🔴 needs-work (`error-messages`, `inline-validation-timing`, `required-optional-marking`, `schema-driven-forms`). Same form-legibility trio as StringInput, inherited through the shared `FormField` chrome: the error hides behind a hover tooltip, requiredness is unmarked, and validation defers to publish |
| Patterns  | `error-messages` · `inline-validation-timing` · `required-optional-marking` · `schema-driven-forms`                                                                                                                                                                                                             |
| Mechanism | derives mobile `inputMode` from the field’s `min` / `integer` / `precision` rules (numeric, decimal, or text), plus a wheel-event guard against scroll mutation                                                                                                                                                 |

It looks like a plain text box, but it is quietly schema-aware. From the field’s own `min` / `integer` / `precision` rules it picks the right mobile keyboard: a number pad for integers, a decimal pad for prices, plain text when nothing constrains it, so an editor on a phone gets sensible keys. And it installs a wheel guard, so an accidental scroll over the field never silently nudges the value up or down.

Under the hood it wraps `@sanity/ui`’s `TextInput` at `type="number"`, mounted for real inside the real `FormField` chrome via `fieldTestHarness`. It inherits the same form-legibility trio as every field; the Current/Recommended fixes for it are built once on **StringInput**.

> **Why it matters:** a `type="number"` input will happily change its value when you scroll over it, a classic way to corrupt data without noticing. NumberInput installs a wheel guard so that cannot happen; if you ever rebuild this field, keep that guard.

The page closes **in context**: the numeric fields at work, a review of _Anna Karenina_ with its rating and price side by side in one live form.
