---
source: stories/structure/DocumentGroupInventory.stories.tsx
title: 'Quarterly Planning Review (edited)'
blocks: 1
roundtrip: true
sourceHash: c433720b335fe88d
---

<!-- @component -->

A header nudge and the button it points at do not check the same thing before they render. One invites a click; the other has already decided there is nothing to show.

|          |                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `DocumentGroupInventoryAction.tsx` (trigger) and `DocumentGroupInventory.tsx` (popover content), plus `DocumentGroupInventoryHint.tsx` |
| Tier     | CORE: the trigger and the full "which version am I looking at, which am I about to delete" surface, gated by a beta flag               |
| Audit    | 🔴 needs-work (`empty-states`). See `HintAvailabilityMismatch` below                                                                   |
| Patterns | `empty-states`                                                                                                                         |

Three pieces that only ever appear together in production, storied here as one chapter. The action is the status-bar trigger: a popover wrapping a button whose label reads the current document's perspective, Draft, Published, a release title, or Proposed changes for an agent bundle. It renders nothing at all, no placeholder, no disabled state, while versions are loading or none exist. The inventory itself is the popover's content: a filterable list of every draft, published, or release version of the group, each row selectable, with a footer delete button that opens the confirm delete dialog, storied separately under Overlays & Navigation. The hint is an onboarding nudge in the document header that points at the same trigger.

> **Why it matters:** the hint and the action agree on the one gate that is cheap to check from anywhere, a feature flag; both read it. Only the action also checks whether there is anything to show. The hint has no such check: it is driven purely by a session counter. A document with the flag on but nothing else to inventory can show the hint inviting a click while the trigger it points at has already rendered nothing.

<details><summary><b>No injectable seam for the hint's storage read (a finding, not a workaround).</b></summary>

The hint's underlying status function takes a storage interface as a parameter, and its own unit test injects an in-memory fixture through it, but the hint component hardcodes the real browser storage adapter, with no prop to substitute another one. The seam the test file uses does not reach the component. The active and inactive stories below drive it the only way a caller outside the component can: writing the same storage keys the real adapter reads, reconstructed from the status module's own constants, verified against source, not guessed.

</details>
