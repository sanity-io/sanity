---
source: stories/forms/ArrayInput.stories.tsx
title: 'Author'
blocks: 2
roundtrip: true
sourceHash: 01aef42851701140
---

<!-- @component -->

Adding an item to an array of objects is a plus sign that opens a template popover and then a separate editor, never an inline append row, and the item that lands is flagged critical before its author has typed a single character.

|          |                                                                                                                                                                                                                                                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsInput.tsx`, Studio-only, no DS equivalent                                                                                                                                                                                                |
| Tier     | CORE. Arrays of objects are how structured, repeatable content is authored; the add-flow, item rows and reordering are content-model machinery with no design-system equivalent                                                                                                                                         |
| Audit    | 🔴 needs-work (`new-item-row`, `cards`, `inline-validation-timing`). Two findings: adding an item opens a template popover and then a separate editor rather than an inline append row, and a freshly added item is toned critical before the author types anything (the mirror of the audit's late-validation finding) |
| Patterns | `new-item-row` · `cards` · `inline-validation-timing`                                                                                                                                                                                                                                                                   |

See the Premature validation Current/Recommended pair; it is real Studio behaviour, sourced from `useDocumentForm` through `useValidationStatus` with no touched or first-publish gate.

The interactive stories (empty, add single/multi type, current-new-item-row, error state) run a live `FormBuilder` (`lib/formBuilderHarness.tsx`, the port of `packages/sanity/test/browser/TestForm.tsx`) over a real, mutable document. That is what makes adding the first item actually work: the add button appends through the real patch pipeline, the item lands and opens its editor, and the min-length rule tones the empty list from real `validateDocument` markers. A bare `ArrayOfObjectsInput` mount (`FormStub` only) renders the empty state and add button, but its append handlers are inert no-ops, clicking Add does nothing, silently, so the add-flow stories use the live harness instead.

**Where the bare mount survives.** The read-only story keeps the bare `FormStub` mount: the add button is correctly disabled there, so no live patch pipeline is needed to show it. `PopulatedRows` runs the same live `FormBuilder` over a document that already has three contributors, with real member resolution, per-item `validateDocument` markers, editable rows, and reorder.

> **Why it matters:** validation should engage after the first meaningful interaction, not on creation. Instead a brand-new row flashes red the instant it lands, before the author has had a chance to fill it in, teaching them to distrust the add button itself.

The page closes in context: the Contributors array as one field of the "Anna Karenina" book being edited, beside its Title.

<!-- @story PrematureValidationCurrent -->

**Current (audit finding, `inline-validation-timing`, premature).** The mirror of
the audit's _late_-validation finding: here validation fires too **early**. The
moment you add an item whose type has a required field, the fresh, untouched item is
toned **critical**, red before you have typed a single character. "Danger, danger" on
a field the author has not even reached yet.

> **This is real Studio, not a harness artefact.** `useDocumentForm` feeds the live
> `useValidationStatus` markers straight to the form with no first-publish gate and no
> per-field "touched" state (Sanity's form has no touched concept), so the validation
> store tones a just-created member critical as soon as it recomputes. The story seeds
> a `roster` with one contributor that has a role but no `name` (a stand-in for the
> item you just appended); it renders red on load, exactly the state you land in the
> instant you click **Add item** on `--empty` or `--error-state`.

The principle it breaks: validation should engage after the first meaningful
interaction (touch/blur), not on creation.
