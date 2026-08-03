---
source: stories/status/ChangeTitleSegment.stories.tsx
title: 'Lists & Data/ChangeTitleSegment'
blocks: 1
roundtrip: true
sourceHash: 2357d250540eba25
---

<!-- @component -->

Two identical absences are treated differently: a newly created item with no annotation falls back to bare text, while a deleted item in the same situation still gets a full card. And the moved case carries its whole meaning, direction and distance, in a tooltip most people will never hover.

|          |                                                                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/field/diff/components/ChangeTitleSegment.tsx`                                                                        |
| Tier     | SERVICE. One crumb of the breadcrumb above every change in Review Changes                                                                      |
| Audit    | 🟡 needs-work (`change-visibility`). Two identical absences are treated differently, and the moved case carries its whole meaning in a tooltip |
| Patterns | `change-visibility`                                                                                                                            |

One segment of the path over a change. A field name, or an array position with what happened to it.

Plain props and no context beyond i18n and the annotation colour manager, so the fixtures here are literally the component's arguments.

**What reading it turned up.**

<details>
<summary><b>Created and deleted treat a missing annotation differently.</b></summary>

`CreatedTitleSegment` checks `if (annotation)` and falls back to bare `<Text>` when there is none: no card, no tooltip, and therefore no indication that the item is new. `DeletedTitleSegment` passes `annotation || null` straight into `DiffCard` and always renders the card. Same absence, two answers. Compare the two "no annotation" stories below.

</details>

<details>
<summary><b>A moved item shows "#2 ↑2" and nothing else.</b></summary>

The direction is a glyph and the distance is a bare number; the sentence that explains them (`changes.array.item-moved`) is in the tooltip. It is the third component in this subsystem where the verb lives only on hover.

</details>

<details>
<summary><b>The moved branch re-checks what the guards proved.</b></summary>

It reads `if (hasMoved && typeof toIndex !== "undefined" && typeof fromIndex !== "undefined")`, but `created` (fromIndex undefined) and `deleted` (toIndex undefined) have both already returned above it. Neither check can fail.

</details>

> **Why it matters:** this is the fourth instance of the same shape in `core/field` and `core/form`: a guard re-testing a condition its own earlier returns already established (ledger 69, 75, and now this). Individually each is harmless. Together they say the subsystem does not trust its own control flow, usually a sign the branches were added one at a time by different hands.
