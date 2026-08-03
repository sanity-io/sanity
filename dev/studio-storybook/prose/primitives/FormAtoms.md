---
source: stories/primitives/FormAtoms.stories.tsx
title: 'UI v3 Primitives/Form'
blocks: 1
roundtrip: true
sourceHash: 984aed15a835710d
---

<!-- @component -->

Every Studio input is one of these raw controls plus a layer of composition, and reading the atom on its own is how you tell a control defect from an input-composition defect: a `BooleanInput` is a `Switch` (or `Checkbox`) plus a `FormField`, a `StringInput` is a `TextInput` plus validation chrome.

|          |                                                                                                                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `@sanity/ui` primitives: the toggle, choice, and text-entry controls                                                                                                                                       |
| Tier     | ATOM. Wrapped by the Studio inputs in Forms & Input: `Switch`/`Checkbox` sit inside `BooleanInput`, `TextInput`/`TextArea` inside `StringInput`, `NumberInput`, `SlugInput`, `Select` inside `SelectInput` |
| Audit    | ⚪ not-audited as a unit; instances inherit whatever the consuming input’s audit found                                                                                                                     |
| Patterns | `schema-driven-forms`                                                                                                                                                                                      |
| States   | enabled, disabled, read-only, plus a fourth for the toggles, indeterminate                                                                                                                                 |

Every control here reads across those states, and the toggles add indeterminate, the "not yet set" value a fresh boolean field shows before the editor touches it.
