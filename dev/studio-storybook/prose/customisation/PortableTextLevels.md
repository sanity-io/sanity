---
source: stories/customisation/PortableTextLevels.stories.tsx
title: 'Customisation/Portable Text: Three Levels'
blocks: 4
roundtrip: true
sourceHash: 1c4f519bb5266845
---

<!-- @component -->

This page inventories the precedent for a user-created Portable Text block: fourteen seams across three levels, config, schema, editor. Two of those levels look alike and are not, which is the half worth reading before copying the nearest example in the codebase.

|          |                                                                    |
| -------- | ------------------------------------------------------------------ |
| Source   | the complete inventory of ways to change how Portable Text renders |
| Tier     | SERVICE                                                            |
| Coverage | fourteen seams across three levels: config, schema, editor         |

Eleven of the fourteen are the documented customisation API and behave the way the rest of this chapter describes: they run through the form builder, they hand you `renderDefault`, and decorating beats replacing. Three of them are not that at all.

---

### The finding: Sanity's own custom Portable Text block does not use the seams

Comments and Tasks both embed a custom `mention` inline object in a Portable Text field. It is the closest thing in the codebase to a first-party worked example, and it is built at the editor level, not through `components.inlineBlock`:

- `core/comments/components/pte/config.ts` compiles a private schema with `Schema.compile()`, outside the workspace, declaring `mention` and stripping the defaults (`marks: {annotations: []}`, one style, `lists: []`).
- `core/comments/components/pte/render/renderChild.tsx` branches on `value._type === 'mention'` and returns a `MentionInlineBlock`, passed to the editor as the `renderChild` prop.
- `core/tasks/.../DescriptionInput.tsx` reuses that whole input and adds its own `renderBlock`.
- Inline comment highlights use a third mechanism again, `rangeDecorations`, which attaches to a selection rather than to any schema type.

It's the correct choice for what those surfaces are. A comment box is a Portable Text editor with no document behind it: no form state, no validation, no presence, no patch channel. The eleven schema and config seams are wired _through_ the form builder, so a surface with no form cannot reach them. `renderChild` is wired through the editor.

What it means for anyone reading the codebase for precedent: the nearest first-party example teaches an API you should not use for a document field, and the reason is invisible unless you notice that Comments never mounts a form. If you are adding a custom block to a real document, story 2 of _Portable Text Blocks_ is the pattern, not this one.

---

Choosing, in one line each: customising one type in a document field uses the schema level, almost always this. A treatment that genuinely belongs on every block everywhere uses the config level, rare, and it catches paragraphs too. Building a Portable Text surface that is not a document field uses the editor level, and accept that you are rebuilding what the form gave you.

> **Why it matters:** the nearest first-party example in the codebase is not the pattern to copy for a document field. It solves a different problem, an editor with no form behind it, and following it for a real document means silently rebuilding validation, presence and the edit dialog from scratch.

<!-- @story AllSeams -->

All fourteen, in declaration order. Read the level badge first: it tells you whether `renderDefault` is on the table before you read what the seam covers.

<!-- @story ByLevel -->

The same inventory, grouped by the distinction that decides what you get for free. Seven of the eleven form-mediated seams are schema level, which is the level most work should happen at and the one least represented in the documentation.

<!-- @story WhatYouGive -->

The trade, stated plainly. Every row below is something the form builder supplies and the editor level does not, which is what the phrase "below the form" means.
