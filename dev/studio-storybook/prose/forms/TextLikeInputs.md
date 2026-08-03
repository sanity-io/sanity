---
source: stories/forms/TextLikeInputs.stories.tsx
title: 'Contact'
blocks: 1
roundtrip: true
sourceHash: bbeb5d3110682f5e
---

<!-- @component -->

These fields hint at a format but do not enforce or repair one: they will not trim a stray space, add a missing `https://`, or normalize a phone number. The keyboard is smarter than the validation.

|          |                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/`, Studio-only (no design-system equivalent)                                                                                                                                                                                                                                                                                                                                                                      |
| Tier     | SERVICE. Three format-specialized string fields. Each wraps `@sanity/ui`’s `TextInput` and sets the HTML `type` and `inputMode` so the browser offers the right on-screen keyboard and native hints: `EmailInput` → `type="email"`, `TelephoneInput` → `type="tel"`, `UrlInput` → `type="url"` (or `text` when the field’s `uri` rule allows relative URLs). All bind `validationError` → `customValidity` and compose with the real `FormField` chrome |
| Audit    | 🔴 needs-work (`error-messages`, `forgiving-format`, `input-hints`, `schema-driven-forms`). The inputs surface the browser keyboard hint but do not reformat or normalize input (`forgiving-format`), and an invalid value only tints the field while the message hides behind the header hover (`error-messages`). The placeholder is the only in-field hint (`input-hints`)                                                                           |
| Patterns | `error-messages` · `forgiving-format` · `input-hints` · `schema-driven-forms`                                                                                                                                                                                                                                                                                                                                                                           |

Three format-specialized text fields, Email, URL and Telephone, that look like a plain string box but tell the browser what kind of value to expect.

These three are the same text field wearing different hats. Each sets the HTML `type` and `inputMode` so a phone brings up the right on-screen keyboard, the @ key for email, a dial pad for telephone, the URL row for a web address, and the browser offers its native format hints. Small touches, but they are the difference between a form that fights a mobile editor and one that gets out of the way.

Under the hood: `EmailInput` → `type="email"`, `TelephoneInput` → `type="tel"`, `UrlInput` → `type="url"` (or `text` when the field’s `uri` rule allows relative URLs). All bind `validationError` → `customValidity` and compose with the real `FormField` chrome. Mounted for real via `fieldTestHarness`; the shared form-legibility fixes live on **StringInput**.

> **Why it matters:** these fields hint at a format but do not enforce or repair one: they will not trim a stray space, add a missing `https://`, or normalize a phone number (`forgiving-format`). The keyboard is smarter than the validation; plan to normalize yourself if the shape matters downstream.

The page closes **in context**: an author contact record, the email, website and telephone fields filled in together in one live form.
