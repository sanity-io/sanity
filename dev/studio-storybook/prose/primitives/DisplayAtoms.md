---
source: stories/primitives/DisplayAtoms.stories.tsx
title: 'UI v3 Primitives/Display'
blocks: 1
roundtrip: true
sourceHash: ed2d7a32baa9b325
---

<!-- @component -->

Every pane header, field label, hint, code sample, and presence cursor in Studio renders through one of these five atoms, and none of their sizes are eyeballed: each resolves to a fixed pixel value from the theme, so reading a ladder turns a size choice into a measured decision instead of a habit.

|          |                                                                                                                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `@sanity/ui` primitives: the four type roles (`Text`, `Heading`, `Code`, `Label`), the status chip (`Badge`), the collaborator glyph (`Avatar`)                                         |
| Tier     | ATOM. Consumed everywhere: every pane header a `Heading`, every field label a `Label`, every hint a muted `Text`, every Vision result a `Code` block, every presence cursor an `Avatar` |
| Audit    | ⚪ not-audited as a unit; instances inherit whatever the consuming component’s audit found                                                                                              |
| Patterns | `typography`                                                                                                                                                                            |
| Scale    | Text 10/13/15/18/21px · Heading 13/16/21/27/33/38px · Code 10/13/16/19/22px · Label 8.1/9.5/10.8/12.25/13.6/15px                                                                        |

The type scale is 0-indexed and resolves to those fixed pixel sizes, the same numbers the theme ships. Each ladder below walks the full range for one role.

> **Why it matters:** Label at size 0 sits at 8.1px, below a comfortable legibility floor (design law 8). The ladder makes that floor a visible decision, not an accident.
