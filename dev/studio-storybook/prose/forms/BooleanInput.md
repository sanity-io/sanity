---
source: stories/forms/BooleanInput.stories.tsx
title: 'Settings'
blocks: 1
roundtrip: true
sourceHash: 0a4714c57240bbcb
---

<!-- @component -->

BooleanInput draws its own field header instead of being wrapped in the shared one, so every story on this page has to tell its harness not to double-wrap it.

|          |                                                                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/BooleanInput.tsx`, Studio-only, no DS equivalent                                                                                                                                          |
| Tier     | SERVICE. The boolean field, and the one primitive input that builds its own `FormField` chrome rather than being wrapped in it                                                                                                  |
| Audit    | 🔴 needs-work (`error-messages`, `similarity`, `schema-driven-forms`). On error the field only shifts to a critical card tone and shows the header's hover-only validation icon; the message stays behind the hover             |
| Atom     | the control itself is the `@sanity/ui` `Switch` (or `Checkbox`); see [UI v3 Primitives → Form](?path=/docs/ui-v3-primitives-form--docs) for the raw atom, its state matrix, and the indeterminate (unset) value read on its own |
| Patterns | `error-messages` · `similarity` · `schema-driven-forms`                                                                                                                                                                         |

The yes/no field, a switch or a checkbox, for the true-or-false facts on a document, like whether a post is featured or the terms were accepted. Reach for it whenever a field is genuinely binary. Pick `options.layout: "switch"` for a toggle or `"checkbox"` for a tick, and Studio handles the parts you would rather not: a value that has never been set reads as _indeterminate_, neither on nor off, instead of a misleading `false`, and a read-only control tells the editor why it is locked rather than just greying out (the real `inputs.boolean.disabled` i18n string).

It wraps `@sanity/ui`'s `Switch` or `Checkbox` (chosen by `options.layout`), handles the indeterminate state for a not-yet-set value, tones the card critical on error, and, when read-only, wraps the control in a `Tooltip` explaining why it is disabled.

One quirk sets it apart from every other primitive input: it builds its own `FormField` chrome instead of being wrapped in it. That is why these stories turn the shared chrome off explicitly, the harness must not double-wrap it. Under the hood it is `@sanity/ui`'s `Switch` (or `Checkbox`), mounted for real via `fieldTestHarness`; the shared form-legibility fixes live on StringInput.

> **Why it matters:** BooleanInput is the only primitive input that renders its own field header. Wrap it in the standard field chrome and it would show two labels stacked, which is exactly why every story on this page turns the shared header off.

The page closes in context: the pre-publish settings for the Anna Karenina book, the homepage-feature switch above the terms checkbox, both live, in one panel.
