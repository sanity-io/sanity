---
source: stories/structure/StructureDialogs.stories.tsx
title: 'Home'
blocks: 6
roundtrip: true
sourceHash: 8700cb731d70e3b0
---

<!-- @component -->

Deleting a document that nothing references is trivial. Deleting one that fifteen other documents point at breaks fifteen documents, and the editor pressing delete usually has no idea.

|          |                                                    |
| -------- | -------------------------------------------------- |
| Source   | `packages/sanity/src/structure/components/`        |
| Tier     | SERVICE                                            |
| Patterns | `destructive-confirmation` · `reference-integrity` |

These are the two dialogs the structure tool raises when an action needs more than a yes: deleting a document that other documents point at, and asking for permission you do not have.

The delete dialog is the most careful destructive confirmation in the product, and the reason is referential integrity. So it does not ask "are you sure". It counts the references first, splits them into internal and cross-dataset, and lists the referring documents so an editor can go and look. It is slower to use on purpose.

That counting is also why the body is a separate component from the dialog: the dialog runs the reference query and handles its loading and error states, while the body renders whatever the count turned out to be. This page stories the body, because the body is where the decisions are; the query wrapper needs a live dataset.

Three harness notes: the reference list renders a real preview link per referring document, so the schema must define every type in the fixture or the preview throws. That link also needs the pane router context, stubbed here with inert anchors, which is safe precisely because the component reads that context for navigation rather than for state. And the referring documents are previewed for real, so they must exist in a seeded preview store; a missing one resolves to null and the preview layout throws.

A shape worth copying rather than guessing: the body takes the exact object the underlying observable emits, including its loading flag, project ids, dataset names, and the unknown-dataset-names flag. Passing an invented shape compiles under a cast and then throws at render, because the component destructures arrays the fixture never had. Read the type, do not infer it from the props you think it needs.

> **Why it matters:** the permission dialog is the other half of a pattern this codebase uses well. Rather than telling a viewer they cannot edit and stopping, it offers to send the request. An error message that ends in an action is worth several that do not.

<!-- @story DeleteNoReferences -->

The safe case. Zero references, so the dialog is a plain confirmation - no list, no warning, no friction beyond the single click it deserves. Getting this case _quiet_ is as much a design decision as getting the dangerous one loud.

One asymmetry worth noticing against the story below: this version does **not** name the document. It asks whether you are sure you want to delete all the versions of this document, while the referenced version names both the document and everything pointing at it. Defensible, since the reader just clicked delete on a document they are looking at - but the two confirmations answer "which document?" differently, and only one of them survives being read out of context.

<!-- @story DeleteWithReferences -->

Three documents reference this one, and the dialog lists them. Not a count in a sentence - the actual documents, previewed, so you can recognise them.

"3 documents reference this" is a number you cannot act on; a list of three titles is three decisions you can make. It is also more expensive to render and slower to read, which is correct here and would be wrong on a routine confirmation.

<!-- @story DeleteCrossDataset -->

Cross-dataset references are counted separately, and correctly so: an internal reference is something you can go and fix, while a reference from another dataset may belong to a team you cannot see and cannot edit.

The dialog cannot list those documents - it has no read access to them - so it reports the count and says which dataset. Less information than the internal case, and honest about why.

<!-- @story Unpublish -->

The same body with `action="unpublish"`. Unpublishing is reversible and deleting is not, and the copy changes accordingly - the reference list is still shown, because a broken reference is broken whether the target was removed or merely hidden.

<!-- @story RequestPermission -->

A viewer who needs to edit. Rather than a dead end, the dialog composes a request to the project administrators with an optional note.

The pattern generalises: the studio has several places where the answer is "you cannot do this", and the ones that also say "here is how to ask" are the ones that do not generate support tickets.
