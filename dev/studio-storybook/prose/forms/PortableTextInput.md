---
source: stories/forms/PortableTextInput.stories.tsx
title: 'Mention'
blocks: 1
roundtrip: true
sourceHash: dd15a0709ef25113
---

<!-- @component -->

Where most editors hand an author a soup of HTML, Portable Text keeps rich text as typed, addressable blocks: every paragraph, heading, list item and embedded object is real data, queryable and renderable however each channel needs, with a familiar toolbar sitting on top so nothing about writing it feels different.

|          |                                                                                                                                                                                                                                                                                                                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tier     | CORE. The decomposition map’s one true resident: rich text as typed, addressable blocks is the content-model machinery itself, with no design-system equivalent (its chrome was a Carbon 🔴 Gap)                                                                                                                                                                                        |
| Audit    | 🔴 needs-work (`block-editor-authoring`, `governance-deprecation`). The toolbar collapses responsively and undo steps back operations correctly, but undo/redo is keyboard-only with no on-screen affordance, inserting an object mid-block silently splits it into fragments, and a deprecated "Image" insert control renders near-identically to live ones with its reason hover-only |
| Patterns | `block-editor-authoring` · `governance-deprecation`                                                                                                                                                                                                                                                                                                                                     |

Studio’s rich-text editor: the one that stores formatting as structured, queryable blocks instead of an HTML blob, and lets you drop custom objects right into the prose. No design system ships anything like it; its chrome was a Carbon 🔴 Gap.

Every story here mounts the **real** `PortableTextInput` at full depth: `lib/formBuilderHarness.tsx` (the `TestForm` port) runs a live `FormBuilder` over the schema, so the editor arrives as a real resolved form member: real toolbar, real `@portabletext/editor` contenteditable that accepts typing, real block/inline objects through their previews, real `validateDocument` markers. This is the same mount `packages/sanity`'s own PT browser tests use (`__tests__/InputStory.tsx` → `TestWrapper` + `TestForm`).

The two-variant audit stories sit at the end: `Current` states are the unmodified component; `Recommended` states are prop-driven compositions of `@sanity/ui` primitives illustrating the resolved affordance.

> **Why it matters:** inserting a block object mid-paragraph **silently splits that paragraph into two blocks**, no warning, and undo is keyboard-only with no on-screen affordance. It is the sharpest edge in the editor, and the one the `block-editor-authoring` audit most wants softened.

The page closes **in context**: the block editor as the Body of an "Anna Karenina" article being written, headings, decorated prose, a blockquote and a callout, beside the document Title.
