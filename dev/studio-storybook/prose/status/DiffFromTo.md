---
source: stories/status/DiffFromTo.stories.tsx
title: 'The Garden of Forking Paths'
blocks: 1
roundtrip: true
sourceHash: c667635221ed480e
---

<!-- @component -->

The verb that tells a reader whether something was added, removed, or changed lives only in the tooltip. On the canvas the difference between an addition and a removal is carried entirely by strikethrough styling and colour, the one signal that does not survive being printed, screenshotted into a ticket, or read by someone with a colour-vision deficiency.

|          |                                                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/field/diff/components/DiffFromTo.tsx`                                                                              |
| Tier     | CORE. The atom of the Review Changes panel; every field-level change a person reads goes through it                                          |
| Audit    | 🟡 needs-work (`change-visibility`). The from/to pair carries its meaning in a tooltip, and one reachable combination renders an empty frame |
| Patterns | `change-visibility`                                                                                                                          |

One field, before and after. It decides whether a reader sees a value, a strikethrough, an insertion, or both side by side.

Nothing here is hand-authored. `@sanity/diff` exports the same `diffInput(wrap(from), wrap(to))` the studio itself calls, so each story supplies two plain documents and the real differ decides `action`, `fromValue`, and `toValue`. A fabricated `Diff` literal would satisfy the type and skip the only interesting part.

**What reading it turned up.** The component has four outcomes and reaches them through two `&&` expressions rather than four branches:

- `action === "unchanged"` returns a bare `DiffCard` with no tooltip at all, so an unchanged field is the one case with no attribution.
- `from && !to` is a removal: a `del` card alone.
- `!from && to` is an addition: an `ins` card alone.
- both present falls through to `FromTo`, the side-by-side pair.

`from` and `to` are each guarded by `diff.fromValue !== undefined && diff.fromValue !== null`, which means a changed diff whose values are both null renders `<FromTo from={false} to={false} />`: a tooltip wrapper around an empty frame. It is reachable whenever a field is cleared from one nullish value to another.

> **Why it matters:** the verb that tells a reader whether something was added, removed, or changed lives only in the tooltip (`useChangeVerb`), so on the canvas alone, an addition and a removal are indistinguishable except by strikethrough and colour.
