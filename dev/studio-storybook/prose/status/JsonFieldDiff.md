---
source: stories/status/JsonFieldDiff.stories.tsx
title: 'Lists & Data/JsonFieldDiff'
blocks: 1
roundtrip: true
sourceHash: 5e5ae9cf451897fb
---

<!-- @component -->

This is the renderer a person meets when someone changed the schema and a field is no longer recognised: raw JSON, before and after, under a caution card, with no way to tell an addition from a removal except colour and strikethrough.

|          |                                                                                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/field/diff/components/JsonFieldDiff.tsx`                                                                                                   |
| Tier     | SERVICE. The fallback renderer in Review Changes, reached when a changed field has no schema type the studio recognises                                              |
| Audit    | 🟡 needs-work (`change-visibility`, `error-recovery`). The warning it carries is unconditional, and one reachable state shows the warning with nothing underneath it |
| Patterns | `change-visibility` · `error-recovery`                                                                                                                               |

What Review Changes shows when it cannot identify the field: raw JSON, before and after, under a caution card explaining why the field is showing as JSON.

Nothing is hand-authored: `@sanity/diff` produces the real diff from two documents, exactly as `lib/diffHarness.tsx` argues it should.

**What reading it turned up.**

<details>
<summary><b>The caution card is unconditional.</b></summary>

It sits outside every branch, so it renders whatever the diff says, including for a field where nothing meaningful changed. That is arguably right for this component (the point is "this field is not in the schema") and it does mean the warning is furniture rather than a signal.

</details>

<details>
<summary><b>There is no `unchanged` branch at all.</b></summary>

`DiffFromTo`, which does the same job for known types, opens with `if (action === "unchanged")` and returns a plain card. This one has no such check: an unchanged field renders as a from/to pair with a down arrow between two identical blocks of JSON.

</details>

<details>
<summary><b>`content` can be `null`.</b></summary>

When neither `fromValue` nor `toValue` survives its guard, the component returns the caution card and nothing else: a warning about a field, with no field shown.

</details>

<details>
<summary><b>`jsonify` has a dead branch.</b></summary>

It opens `if (typeof value === "undefined") return "undefined"`, but both call sites sit inside guards that have already excluded `undefined`. The string `"undefined"` can never be printed.

</details>

> **Why it matters:** this is the moment someone most needs to know what happened to their content, and what they get is unlabelled JSON under a warning that appears whether or not anything meaningful changed.
