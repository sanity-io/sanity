---
source: stories/behaviors/CapabilityGate.stories.tsx
title: 'Laws & Behaviors/CapabilityGate'
blocks: 1
roundtrip: true
sourceHash: e387380d4b6e724c
---

<!-- @component -->

CapabilityGate lets the same Studio code render standalone and embedded without duplicating chrome. Studio does not always run on its own: it can be embedded inside a host application, the Sanity Dashboard, another core UI, that already ships things like the global user menu or the workspace switcher.

|              |                                                                                                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source       | `packages/sanity/src/core/components/CapabilityGate.tsx`, Studio-only (no design-system equivalent)                                                                                                                                         |
| Tier         | SERVICE. A conditional-render gate, not chrome: it is how Studio hands a responsibility (the global user menu, workspace control, comlink) to whatever _hosts_ it                                                                           |
| Audit        | ⚪ not-audited, architectural plumbing. Storied because it has a real, visible effect (render vs render-nothing) that is easy to get backwards, and seeing both branches side by side is the fastest way to understand the inverted default |
| Patterns     | `component-api-design`                                                                                                                                                                                                                      |
| Capabilities | `globalUserMenu` · `globalWorkspaceControl` · `comlink`                                                                                                                                                                                     |

A component marks a slice of the tree as "I provide this locally, unless my host already does" and CapabilityGate renders that local implementation only when the rendering context does not already provide the capability, then steps aside when the host takes over.

The gotcha is the default `condition="unavailable"`: children render when the capability is absent (the local fallback fills in). Flip to `condition="available"` and children render only when the host provides it. The stories seed capabilities via a lightweight resource-cache decorator.

> **Why it matters:** the default is inverted from what most people expect: setting the condition to unavailable renders the children, because the gate exists to supply a local fallback a host can override. Read it as render this unless someone upstream already handles it.

The last story shows the gate in context: Studio's standalone top bar over the book workspace, where the gate supplies Studio’s own user menu because no host provides one.
