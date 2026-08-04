---
source: stories/data/Progress.stories.tsx
title: 'Lists & Data/Progress'
blocks: 1
roundtrip: true
sourceHash: 444ebdcf01b8dec5
---

<!-- @component -->

CircularProgress and LinearProgress are two correct determinate progress primitives that Studio already ships but rarely reaches for. The audit found panes going blank on load with no skeleton, not because these components are broken, but because nothing calls them there.

|          |                                                                                                                                                                                                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/components/progress/`, Studio-only (no DS equivalent)                                                                                                                                                                                            |
| Tier     | CHROME. Two value-driven determinate progress indicators. `CircularProgress` draws an SVG ring via `stroke-dashoffset`; `LinearProgress` translates a filled bar. Both take one prop, `value` (a 0-100 percentage), and both clamp out-of-range input rather than overflow |
| Audit    | ⚪ not-audited as units, but they are the primitives the `progress-indicator` finding points at. The defect is non-use at the pane level, not a fault in these components                                                                                                  |
| Patterns | `progress-indicator`                                                                                                                                                                                                                                                       |

`CircularProgress` clamps with `Math.min(Math.max(value, 0), 100)`; `LinearProgress` translates by `value - 100%` and is clipped by an `overflow: clip` root, so 120 and -20 both render as full / empty rather than spilling. The clamping story shows both extremes.

> **Why it matters:** storied here so the fix has a component to reach for, rather than needing a new one built.
