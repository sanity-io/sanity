---
source: stories/tools/Vision.stories.tsx
title: 'Lists & Data/Vision/In Context'
blocks: 1
roundtrip: true
sourceHash: a495b5914afcd58f
---

<!-- @component -->

Vision is where developers go to ask the dataset a question directly. It is a full GROQ playground living inside Studio: type a query, press Fetch, and read exactly what the Content Lake returns, the same query, the same client, the same result a front end would get. For anyone building on Sanity it is the fastest way to confirm a query does what it should before wiring it into code.

|          |                                                                                                                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/@sanity/vision`, Studio-only (no design-system equivalent); ships as the `vision` tool plugin (`visionTool()`), CodeMirror editors, result tree via `@rexxars/react-json-inspector` |
| Tier     | SERVICE. A developer tool layered over the client seam. It reads and shapes content through `useClient().observable.fetch`, owns no content model of its own, and is opt-in per Studio config |
| Audit    | 🔴 needs-work, findings spread across the six part pages: `sampling-disclosure` · `datatips` · `query-result-shaping` (a fourth, `explain-the-query`, sits on Errors)                         |
| Patterns | `sampling-disclosure` · `query-result-shaping` · `datatips` · `explain-the-query`                                                                                                             |

This is the **In Context** capstone for the Vision pages. The tool decomposes into six shipped parts, each with its own page under **Lists & Data / Vision**:

- **QueryEditor**: the GROQ CodeMirror pane (syntax highlighting, no inline diagnostics).
- **ParamsEditor**: the JSON `$params` pane (inline parse validation).
- **Controls**: the dataset / API-version / perspective selectors and query-URL copy.
- **ResultTree**: the JSON result tree, timings footer, and downloads (the `datatips`, `query-result-shaping`, and `sampling-disclosure` findings live here).
- **Errors**: the GROQ error display (the error-size typography finding lives here).
- **SavedQueries**: the personal + shared saved-query rail (`QueryRecall`).

Below, the whole thing runs at once. Pressing **Fetch** (or Ctrl/Cmd+Enter) executes offline against a canned-response client (`lib/mockVisionClient.ts`) and renders the real result tree, timings, and request URL: the whole playground, no network.

Harness notes: `VisionGui` resolves its query client from Studio context (`useClient()`), not from its `client` prop, so the canned client is injected through `WithStudioProviders({client})` → the mock auth store → `source.getClient()`. The tool also owns document-level `paste` / `keydown` listeners and a `window.innerWidth`-sized split pane; both are real here. The saved-queries rail on the right is live for personal queries (key-value store); shared queries need a real workspace dataset (see the SavedQueries page).

> **Why it matters:** Because this is the live surface and not a mockup, the audit findings are reproducible right here: after a fetch, watch the footer stay silent on count and truncation, note there is no table view or hover datatip on the tree, and trigger an error to see it print smaller than the result it replaced.
