---
source: stories/actions/IntentButton.stories.tsx
title: 'Actions & Commands/IntentButton'
blocks: 1
roundtrip: true
sourceHash: 9e5ac502da1f0c1c
---

<!-- @component -->

IntentButton is how Studio avoids a navigation trap: a button that navigates through a plain click handler quietly takes the web away from a person, no right-click, no middle-click into a new tab, no address to copy.

|               |                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Source        | `packages/sanity/src/core/components/IntentButton.tsx`, Studio-only (no design-system equivalent)                                              |
| Tier          | CHROME. A navigation affordance: the ui-components `Button` bound to a router intent instead of an `onClick`                                   |
| Enabled path  | renders `as={IntentLink}`, a real anchor with an `href` the router resolved                                                                    |
| Disabled path | renders `as="a" role="link" aria-disabled="true"` with no `href`. Inert, still announced                                                       |
| Audit         | ⚪ not-audited as a unit, but it sits on `clear-entry-points` and deep-linking: the affordance the audit found missing at the pane-stack level |
| Patterns      | `clear-entry-points`                                                                                                                           |

The destination is described as an intent, "edit this document" or "create this type", and the router turns it into a genuine link.

Everything cosmetic passes straight through to `Button`: tone, mode, size, icon, text. So an intent button is indistinguishable from an action button until somebody right-clicks it, which is exactly the point. The affordance costs nothing at the call site, and the two render paths in the table above are the whole of the behaviour.

> **Why it matters:** if a target can be reached by URL, make it reachable by URL. A JS-only button throws away deep-linking, new-tab opening and address copying, and nobody files a bug about it, because nothing looks broken. The loss is silent. The default has to be the link.

The last story shows it in context: an author reference row (Leo Tolstoy) whose _Open author_ button is a real, right-clickable, copyable intent link.
