---
source: stories/primitives/LayoutAtoms.stories.tsx
title: 'UI v3 Primitives/Layout'
blocks: 1
roundtrip: true
sourceHash: 571ccfb71c337c74
---

<!-- @component -->

Every pane, dialog, and field in Studio is built from one of these seven atoms, and their gaps and radii are never eyeballed: each is an index-based token that resolves to a fixed pixel value, so reading a ladder turns spacing into a deliberate measurement.

|          |                                                                                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source   | `@sanity/ui` primitives: the raw padded block (`Box`), the toned surface (`Card`), and the four arrangers (`Flex`, `Stack`, `Inline`, `Grid`), plus the reading-width cap (`Container`)                                                          |
| Tier     | ATOM. Consumed by the structure of every pane, dialog, and field: a `Stack` spaces a form vertically, a `Flex` lays a toolbar horizontally, a `Card` tones a field critical on error, a `Container` holds the document form to a legible measure |
| Audit    | ⚪ not-audited as a unit; instances inherit whatever the consuming component’s audit found                                                                                                                                                       |
| Patterns | `layout`                                                                                                                                                                                                                                         |
| Scale    | space 0/4/8/12/20/32/52/84/136/220px · radius 0/1/3/6/9/12/21px                                                                                                                                                                                  |

Reading the ladder is how a `space={3}` becomes a deliberate 12px rather than a guess.
