---
source: stories/envisioned/SkeletonFirstLoading.stories.tsx
title: 'War and Peace'
blocks: 1
roundtrip: true
sourceHash: 788c63cb555b715d
---

<!-- @component -->

A blank region and a spinner both say nothing is here; a skeleton says six rows of exactly this shape are coming. What makes this envisioned rather than proposed is only reach: the skeleton-first sequence should be the default load discipline for every list surface in Studio, and the shipped component already contains everything needed to do it.

|          |                                                                                                                                                                                                                                                                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anchor   | `Lists & Data/Previews` (the layout-family stories that already exercise every `isPlaceholder` skeleton branch) and `Lists & Data/LoadingBlock`, the spinner this pattern retires from list duty                                                                                                                                                                 |
| Evidence | audit `skeleton-vs-spinner`, `instant-gratification`, `progress-indicator`, `doherty-threshold`; ledger #14 (the skeleton fix already ships inside the general previews as `isPlaceholder`, the audit’s blank-pane/spinner defect is a call-site change, not a component build); ledger #6 (the one real gap: the portable-text preview family lacks the branch) |
| Patterns | `skeleton-vs-spinner` · `instant-gratification` · `doherty-threshold`                                                                                                                                                                                                                                                                                            |

The difference is not cosmetic, it is the structure of the wait: skeletons commit the layout immediately (no reflow jolt when content lands), they scope the promise (six placeholders, not an indeterminate shimmer), and they make the load feel like the list resolving rather than the pane recovering. Both panels below render the identical component; the left panel merely declines to mount it until data arrives.

> **Why it matters:** press Reload both and the two panes run the same simulated fetch. Each meter counts the milliseconds its pane showed no structure; the current pane banks the full latency as blank or spinner time and pays a layout jolt at the end, while the skeleton pane’s meter reads about zero because structure was on screen from the first frame. The meters are measured live, not asserted.
