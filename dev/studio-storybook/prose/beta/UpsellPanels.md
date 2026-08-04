---
source: stories/beta/UpsellPanels.stories.tsx
title: 'No setup'
blocks: 3
roundtrip: true
sourceHash: 369a442440427d33
---

<!-- @component -->

UpsellPanel is Studio's single, honest answer to selling inside a working tool: one presentational primitive every feature reuses, so the pitch stays consistent and the exits stay real.

|          |                                                                                                                                                                                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/studio/upsell/*` + `.../navbar/free-trial/*`, Studio-only (no design-system equivalent)                                                                                                                                                                           |
| Flag     | plan-gated (commercial limits / usage caps, no config boolean). The panel appears when a feature is unavailable on the current plan or a usage limit is hit; the free-trial button appears during an active trial                                                                           |
| Tier     | CHROME. A conversion/attention layer. `UpsellPanel` is one presentational primitive (hero image + Portable-Text pitch + CTA/secondary buttons); each feature (comments, tasks, releases, document limits) wraps it with its own fixture and telemetry. Nothing here reads or writes content |
| Audit    | ⚪ not-audited. Upsell surfaces were outside the authoring-focused pass. The law they must honour is `interruption-cost` / honest affordance: the CTA is a real link to pricing and the secondary action is a non-blocking dismiss/learn-more, never a dark-pattern trap                    |
| Patterns | `upsell`                                                                                                                                                                                                                                                                                    |

Build a new gated feature and you compose this, not a bespoke paywall. The panel is fully prop-driven off a single `UpsellData` fixture and renders offline. `CommentsUpsellPanel` shows the one-line wrapper each feature adds (a width `Container` plus spacing); Tasks, Releases and Document-limits panels are the same `UpsellPanel` behind their own runtime contexts, so they are represented by the shared primitive here rather than re-mocking each provider. The free-trial pieces are the navbar entry points: the bolt button with a countdown ring, and the popover it opens.

> **Why it matters:** the honest-affordance rule is non-negotiable: the CTA must be a real link to pricing and the secondary action must be a genuine, non-blocking dismiss or learn-more. An upsell that traps the editor is a bug, not a conversion win.

<!-- @story Dialog_Default -->

The interrupting form. Both variants render the identical `UpsellData` - hero image, Portable Text pitch, primary and secondary buttons - so a feature team writes the content once and chooses the moment separately.

The interesting decision is that the dialog returns `null` unless BOTH `data` and `open` are truthy. A missing upsell document is not an error state and not an empty modal; it simply does not appear. That is the right failure for content fetched from a remote dataset the studio does not control - if the pitch cannot be loaded, the user should not learn that a pitch exists.

<!-- @story Dialog_NoData -->

With `data: null` the dialog renders nothing at all. Storied explicitly because it is the state a failed or slow fetch of the upsell document produces, and silence is the correct outcome - an empty modal frame would be worse than no modal.
