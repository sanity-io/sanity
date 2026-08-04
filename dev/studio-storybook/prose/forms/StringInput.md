---
source: stories/forms/StringInput.stories.tsx
title: 'Article'
blocks: 1
roundtrip: true
sourceHash: 22920afada0330f7
---

<!-- @component -->

This is the canonical home of the form-legibility trio: requiredness unmarked, validation deferred to publish, error messages hidden behind hover. Every other string-like field inherits the same defects through the same chrome, and this is where the Current/Recommended pairs for all three are built once.

|          |                                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/StringInput/StringInput.tsx`, Studio-only (no design-system equivalent)                                                                                                                                                                                                                                                                       |
| Tier     | SERVICE. The schema-driven string field. It binds `@sanity/ui`’s `TextInput` to the form layer (patch emission, `validationError` → `customValidity`, i18n) and is composed with the real `FormField` chrome (label, description, validation marker). The primitive is a text box; the wrapper is what makes it a _field_                                                           |
| Audit    | 🔴 needs-work (`required-optional-marking`, `inline-validation-timing`, `error-messages`, `schema-driven-forms`). Requiredness is never marked on the label (it lives only in grey description prose), validation fires only on a publish attempt rather than on blur, and an invalid field shows just a red icon + pink tint while the actual message hides behind a hover tooltip |
| Patterns | `required-optional-marking` · `inline-validation-timing` · `error-messages` · `schema-driven-forms`                                                                                                                                                                                                                                                                                 |

The plain single-line text field, the everyday input behind titles, names and short labels, wrapped in Studio’s label, description and validation chrome.

This is the workhorse, the field most documents are mostly made of. On its own a text box is trivial; what makes it a _field_ is everything wrapped around it: the label and description from the schema, patch emission back to the document, i18n, and the validation marker. StringInput binds `@sanity/ui`’s `TextInput` to all of that, and every other primitive input rides on the same chrome.

These stories mount the **real** `StringInput` inside the **real** `FormField` chrome via `fieldTestHarness`, so the label/description/validation markers are exactly what a document form renders, not a mock. `FormField` computes nothing about requiredness (there is no marker code path), and hands the `validation` array to `FormFieldHeaderText`, which renders it as a hover-only `FormFieldValidationStatus` icon. Every finding below is reproduced by the shipped components, not simulated.

StringInput is the canonical home of the **form-legibility trio**. The Current/Recommended pairs for `required-optional-marking`, `inline-validation-timing`, and `error-messages` are built here once; the other primitive inputs (TextInput, NumberInput, Email/URL/Telephone) inherit the same defects through the same chrome and reference these stories.

> **Why it matters:** this is the canonical home of the **form-legibility trio**: requiredness unmarked, validation deferred to publish, error messages hidden behind hover. The Current/Recommended pairs are built here once; every other string-like field inherits the same defects and points back to this page.

The page closes **in context**: the everyday text fields at work, the _Anna Karenina_ book mid-edit, its title, slug and author byline stacked as one live document form.
