---
source: stories/tools/vision/Errors.stories.tsx
title: 'Lists & Data/Vision/Errors'
blocks: 1
roundtrip: true
sourceHash: 8f8a04148ad5f77e
---

<!-- @component -->

When a query fails, the moment a person most needs to read the error clearly is exactly when Vision renders it hardest to see: the message prints smaller than the result it just replaced.

|          |                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------ |
| Source   | `QueryErrorDialog` → `QueryErrorDetails`, the GROQ error rendering, shown inside the real `VisionGuiResult`              |
| Tier     | SERVICE. Part of the Vision GROQ playground: the result pane’s error state                                               |
| Audit    | 🔴 needs-work (design law 8). Error text renders at `Code size 1` (13px), one step below the `size 2` (15px) it replaces |
| Measured | query editor 13px = error message 13px, successful result 15px; Recommended lifts the message to `size 2`                |

When a query fails the result pane turns critical and prints the message, then a caret line pointing at the offending token, then the line and column.

<details>
<summary><b>The error text renders one step smaller than the result it replaces.</b></summary>

The error text renders through `ErrorCode`, `@sanity/ui` `Code size={1}`, 13px (`fonts.code.sizes[1]`). That is the same size as the query editor (also `sizes[1]`, 13px), but one step below a successful result, which the tree renders at `sizes[2]`, 15px. The moment a query fails, the pane that was showing 15px content swaps to 13px content, and the error, the thing most needing to be read, is set smaller than the result it replaced. The error color is also `--card-muted-fg-color` on a critical card, a muted foreground, so at equal-or-smaller px it reads weaker still. The Recommended story sets the message at `size={2}` (15px) to match the result register.

</details>

> **Why it matters:** the error prints smaller than the result it replaces, 13px against the tree’s 15px, in a muted foreground on a critical card. The instant a query fails, the thing most needing to be read becomes the least legible thing on screen. The Recommended story lifts it back to match.
