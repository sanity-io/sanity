---
source: stories/tools/vision/ResultTree.stories.tsx
title: 'Lists & Data/Vision/ResultTree'
blocks: 1
roundtrip: true
sourceHash: 3c93ff3d45a6b92a
---

<!-- @component -->

The result tree carries three findings at once: hovering a node surfaces no orientation, every result renders only as a tree, and the timing footer never says how many documents came back or whether the API truncated them.

|          |                                                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/@sanity/vision/src/components/VisionGuiResult` (the whole right pane) and `ResultView` (the JSON tree inside it) |
| Tier     | SERVICE. The result of a query, plus the Execution / End-to-end timings footer and the JSON / CSV download buttons         |
| Audit    | 🔴 needs-work, three findings below                                                                                        |
| Patterns | `datatips` · `query-result-shaping` · `sampling-disclosure`                                                                |

The tree is live: click any composite node (`▸`) to expand or collapse it; nested objects and arrays open to depth 4 by default. On a value whose dataset matches the workspace, `_id` / `_ref` grow an edit-intent link. The tree renders at code size 2, 15px.

<details>
<summary><b>Hovering a node surfaces nothing: no type, path, or value tip.</b></summary>

`datatips`. A deep or wide tree gives no orientation on hover, so the author has to expand and read structurally to answer "what is this field?".

</details>

<details>
<summary><b>Every result is a JSON tree and only a tree.</b></summary>

`query-result-shaping`. A flat list of records, the commonest GROQ shape, has no table projection, only nested nodes to expand and compare.

</details>

<details>
<summary><b>The footer reports timing and nothing else.</b></summary>

`sampling-disclosure`. It never states the returned count, the dataset total, or whether the API truncated the result. A truncated result looks identical to a complete one.

</details>

> **Why it matters:** a truncated result looks identical to a complete one, so it is easy to reason about a partial answer as though it were the whole set. The footer says how long the query took and nothing about what it actually returned.
