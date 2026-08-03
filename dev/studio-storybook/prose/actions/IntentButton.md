---
source: stories/actions/IntentButton.stories.tsx
title: 'Actions & Commands/IntentButton'
blocks: 1
roundtrip: true
sourceHash: 9d4c2985527d5918
---

<!-- @component -->

A great deal of what an editor does in Studio is go somewhere, and a button that navigates through a click handler quietly takes the web away from them: no right-click, no middle-click into a new tab, no address to copy. This component is how Studio declines that trade.

|               |                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Source        | `packages/sanity/src/core/components/IntentButton.tsx`, Studio-only (no design-system equivalent)                                              |
| Tier          | CHROME. A navigation affordance: the ui-components `Button` bound to a router intent instead of an `onClick`                                   |
| Enabled path  | renders `as={IntentLink}`, a real anchor with an `href` the router resolved                                                                    |
| Disabled path | renders `as="a" role="link" aria-disabled="true"` with no `href`. Inert, still announced                                                       |
| Audit         | ⚪ not-audited as a unit, but it sits on `clear-entry-points` and deep-linking: the affordance the audit found missing at the pane-stack level |
| Patterns      | `clear-entry-points`                                                                                                                           |

A great deal of what an editor does in Studio is _go somewhere_, and a button that navigates by running a click handler quietly takes the web away from them: no right-click, no middle-click into a new tab, no address to paste into Slack. `IntentButton` is how Studio declines that trade. You describe the destination as an intent, "edit this document" or "create this type", and the router turns it into a genuine link.

Everything cosmetic passes straight through to `Button`: tone, mode, size, icon, text. So an intent button is indistinguishable from an action button until somebody right-clicks it, which is exactly the point. The affordance costs nothing at the call site, and the two render paths in the table above are the whole of the behaviour.

> **Why it matters:** if a target can be reached by URL, make it reachable by URL. A JS-only button throws away deep-linking, new-tab opening and address copying, and nobody files a bug about it, because nothing looks broken. The loss is silent. The default has to be the link.

The page closes _in context_: an author reference row (Leo Tolstoy) whose _Open author_ button is a real, right-clickable, copyable intent link.
