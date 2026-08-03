---
source: stories/behaviors/BetaBadge.stories.tsx
title: 'Laws & Behaviors/BetaBadge'
blocks: 1
roundtrip: true
sourceHash: 285d78f1f2c188b3
---

<!-- @component -->

When something ships in front of editors before it is finished, a Content Release, a new inspector, an experiment, there needs to be one honest, unmissable way to say this is still early. BetaBadge is that marker, and it is deliberately impossible to recolor.

|          |                                                                                                                                                                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/components/BetaBadge.tsx`, Studio-only (no design-system equivalent)                                                                                                                                                             |
| Tier     | CHROME. A one-line convenience over `@sanity/ui` `Badge` that locks tone/radius and defaults the text to "Beta"; `tone` and `mode` are intentionally omitted from its props                                                                                |
| Audit    | ⚪ not-audited as a unit. The maturity-signalling counterpart to `governance-deprecation` (ch11): where the audit found deprecated affordances left visually indistinguishable from live ones, BetaBadge is the sanctioned way to flag not-yet-stable ones |
| Patterns | `governance-deprecation`                                                                                                                                                                                                                                   |

Reach for it and every not-yet-stable feature in Studio wears the same marker, so the signal reads the same everywhere an editor meets it. The `children` default is "Beta", but any short label works ("Alpha", "New", "Experimental"); `fontSize` is the only real dial. The sweeps below show the default, alternate labels, and the font-size scale.

> **Why it matters:** tone and mode are deliberately not exposed, you cannot recolor it. That uniform primary tone is the point: an experimental marker only works as a signal if it looks identical everywhere, so the badge trades flexibility for consistency on purpose.
