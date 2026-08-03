---
source: stories/overlays/TooltipDelayGroupProvider.stories.tsx
title: 'Overlays & Navigation/Tooltip/Delay Group'
blocks: 1
roundtrip: true
sourceHash: f774be6ced566086
---

<!-- @component -->

A toolbar where every icon button waits its own 400ms before showing a tooltip reads as sluggish the moment a finger moves along the row. This provider is how Studio fixes that: once one tooltip in a group has shown, its siblings reveal instantly.

|          |                                                                                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider.tsx`, Studio shadow of `@sanity/ui` `TooltipDelayGroupProvider`            |
| Tier     | SERVICE. An opinionated shadow that hard-codes the shared Studio delay (`TOOLTIP_DELAY_PROPS`, 400ms open) so every grouped tooltip coordinates on one timing     |
| Audit    | ⚪ not-audited. A coordination provider with no rendered surface of its own; it tunes how the audited `Tooltip` (`datatips`) behaves across a cluster of controls |
| Patterns | `datatips`                                                                                                                                                        |

Wrap a cluster of controls (a formatting toolbar, for example) in the provider: the first tooltip in the group still waits the full open delay, but once one is showing, moving between siblings reveals their tooltips instantly, no repeated 400ms wait per button. The provider drops the `delay` prop entirely; the value is fixed.
