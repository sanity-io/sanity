---
source: stories/forms/Slug.stories.tsx
title: 'Post'
blocks: 1
roundtrip: true
sourceHash: 09d592607ed0f65a
---

<!-- @component -->

A slug validation failure hides its message behind a hover on a red-outlined field, and only fires on a Publish attempt, never on blur. The audit caught a literal `Dude, UPPERCASE!` shipping this way, but the point is that the editor cannot see it until they hover, far too late.

|          |                                                                                                                                                                                                                                                                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/Slug/SlugInput.tsx`, Studio-only (no design-system equivalent)                                                                                                                                                                                                                                      |
| Tier     | CORE. The slug is the canonical URL identity of a document; generating and validating it is content-model machinery, not a commodity text field                                                                                                                                                                                           |
| Audit    | 🔴 needs-work (`error-messages`, `inline-validation-timing`, `forgiving-format`). A slug validation failure surfaces as `customValidity` on the native input: a red outline whose message is **hidden until you hover the field** (the audit’s literal "Dude, UPPERCASE!" finding), and it only fires on a Publish attempt, never on blur |
| Patterns | `error-messages` · `inline-validation-timing` · `forgiving-format`                                                                                                                                                                                                                                                                        |

The field that holds a document’s URL-safe identifier, the `my-first-post` in a web address, with a one-click button to generate it from another field like the title.

A slug is the human-readable, URL-safe name a document goes by on the front end, and this field is where it gets set. Point it at a source field (`options.source: "title"`) and a **Generate** button appears: press it and the real `slugify` pipeline turns "My First Post!" into `my-first-post`. Because the slug is a document’s public identity, generating and validating it is genuine content-model machinery, not a commodity text box. It sits in the CORE tier.

The stories mount the **real** `SlugInput` on the full studio provider stack (`lib/testProvider.tsx`). The Generate button reads its source document from a `GetFormValueProvider` seeded with a `post` fixture whose `title` is the configured `source`; pressing it runs the real `slugify` pipeline against that title.

Harness note: `SlugInput` calls `useGetFormValue()`, which **throws** outside a `GetFormValueProvider`, so every story wraps one (this is not in `FormStub`). The input is mounted bare, so document-level chrome (field label, change bar, publish-time validation trigger) is narrated by the stories rather than rendered.

> **Why it matters:** a slug validation failure hides its message behind a hover on the red-outlined field, and only fires on a **Publish** attempt, never on blur. The audit caught a literal `Dude, UPPERCASE!` shipping this way, and the editor cannot see it until they hover, far too late.

The page closes **in context**: the Slug field beneath the Title it generates from, as an editor authoring the "My First Post!" document.
