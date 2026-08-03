---
source: stories/beta/VariantDialogs.stories.tsx
title: 'Versioning/Variant Dialogs'
blocks: 4
roundtrip: true
sourceHash: 9745afa01ba41c2e
---

<!-- @component -->

A variant is a rule rather than a piece of content, a set of conditions deciding which readers see which version of a document, and that makes changing one unlike editing anything else in the studio.

|          |                                                        |
| -------- | ------------------------------------------------------ |
| Source   | `packages/sanity/src/core/variants/components/dialog/` |
| Tier     | SERVICE                                                |
| Patterns | `destructive-confirmation`                             |

Versioning/Variants already stories the create dialog and the tool. These are the two the board flagged as gaps: edit its definition, or delete it.

`EditVariantDialog` reuses the same `VariantDialog` form the create flow uses, seeded from the existing definition, which is the right call: the thing being edited is the same shape as the thing that was created, and a separate edit form would be an opportunity for the two to drift.

`DeleteVariantDialog` is the sharper one. Deleting a variant does not delete the documents written against it; it removes the rule that routed readers to them. The dialog names the variant it is about to remove, because "delete variant?" with no name is exactly the confirmation people click through.

> **Why it matters:** editing a variant changes every document it already applies to, immediately, with no draft state to preview the effect first. Treat an edit like a rule change, not a content edit.

<!-- @story Edit -->

The edit form, seeded from an existing variant. It is the same `VariantDialog` the create flow mounts, with `toEditableVariant` mapping the stored definition back into editable shape - so anything you can express when creating a variant you can also express when editing one, by construction rather than by discipline.

<!-- @story Delete -->

The delete confirmation, naming the variant. `variantTitle` is a required prop rather than optional, which is a small piece of enforcement worth noticing: the component will not let a caller render an unnamed destructive confirmation.

<!-- @story Deleting -->

Mid-delete. The confirm goes to a loading state and the dialog stays open, which is the honest rendering: the variant still exists until the operation returns, and closing early would claim otherwise.
