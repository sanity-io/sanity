---
source: stories/envisioned/ReleasesOverviewRedesign.stories.tsx
title: 'Autumn campaign'
blocks: 6
roundtrip: false
sourceHash: 887211019ca05d77
---

<!-- @component -->
<!-- READ ONLY: this description interpolates values at runtime. -->

A story cannot import across branches, so everything here is rebuilt from `@sanity/ui` primitives rather than imported from the design it documents. What makes these worth more than the usual speculation is that they are not speculation: each reconstructs a design a Sanity team has already argued and built.

|          |                                                                                                                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anchor   | `Releases/*`, the overview and detail screens these would replace, storied throughout that chapter as they stand on `main`                                                                                                                                                                              |
| Evidence | unlike the rest of this lane, these are not arguments being made here. Each one reconstructs a design a Sanity team has already argued and built on ${BRANCH}, whose own docblocks state the reasoning quoted below. That branch adds 25 source files and is 101 commits behind `main` as of 2026-07-26 |
| Patterns | `bulk-actions` · `draft-publish-lifecycle`                                                                                                                                                                                                                                                              |

These pages show the argument, not the artifact. They do not prove the branch implementation works, cannot catch a regression in it, and will differ from it in detail. When the work merges, these should be deleted and replaced by real Studio-lane stories importing the real components.

Each docblock cites the exact file on the branch, so a `git show` against that path is a cheap staleness check. If the design moves, these pages are wrong and the citation is how you find out. That is the same discipline ledger #61 taught: when a story asserts something it cannot demonstrate, name the file that would prove it.

The options for doing this properly, and why it is not done yet, are in `docs/workspace/storybook-briefs/wip-stories-plan-PARKED-2026-07-26.md`.

> **Why it matters:** a story imports its component by path, and that path resolves against the checked-out branch. These components exist only on the feature branch, so the catalog cannot import them, one artifact cannot track many branches. Everything here is rebuilt from `@sanity/ui` primitives in the story file.

<!-- @story Timeline -->

Reconstructs `core/releases/tool/overview/ReleaseTimeline.tsx` (836 lines, the largest new component on the branch).

A single continuous, horizontally scrollable strip spanning every dated release. Drag it, change the zoom, press Today.

The interesting decision is one they rejected. The branch docblock records that the strip deliberately does _not_ rescale its window to fit the current selection, "which was disorienting, the axis jumped and there was no anchor". Instead the axis is fixed and continuous, granularity changes the zoom rather than the range, and a Today button re-anchors. That is a design choice made against a tried alternative, which is the most useful kind to record.

Lane packing is the other idea, and it is reproduced faithfully here. Pills are a fixed width at every zoom, so at coarse granularity they collide. Rather than overlap or shrink them, each drops to the first lane whose previous pill has ended. Zoom out to `quarter` and watch the strip grow taller rather than denser: no release is ever hidden behind another, at any zoom. Height is fixed and the track scrolls, so the surrounding page never reflows.

The edge signposts count releases scrolled off each side and scroll toward them. They are what make one long strip navigable without a rescale, and they are why the rejected alternative was not needed.

<!-- @story TimelineCompact -->

Reconstructs the same file's `density: 'compact'` mode.

The same data as a single-line diamond axis, each marker carrying the hover label. Ten releases in one lane instead of four.

The branch keeps the marker size identical across both densities specifically so there is **no size-shift when switching**. That is a small decision with a large effect: a density toggle that also resizes its targets makes the switch feel like a different screen rather than the same one at a different resolution.

Worth having as its own page because density toggles are usually storied only in their default state, and the interesting question about them is what survives the switch.

<!-- @story OneSwitch -->

Reconstructs `core/releases/tool/overview/SegmentedControl.tsx`.

The branch extracted the cardinality picker into a general segmented control so that, in its own words, "every mutually-exclusive control on the page (kind, timeline zoom, lifecycle) reads as the same cohesive switch rather than a run of loose buttons".

Both rows below are the same three options and the same selected value. The difference is entirely whether the group has a boundary.

The argument is about what the control claims. Loose buttons read as three independent actions: nothing in the shape says that picking one un-picks the others. A bordered group with one ghost and two bleed says "exactly one of these is true" before any label is read. On a page carrying three such controls, the shared shape also says they are the same _kind_ of control, which is the part that only pays off at page scale.

Storied because this is the cheapest idea on the branch and the most portable: it is not about releases at all.

<!-- @story Properties -->

Reconstructs `core/components/detailLayout/DetailPropertiesPanel.tsx`.

The same six facts, twice. On the left as the branch renders them: an aligned `[glyph] [label] [value]` grid where values are **single-line text and semantic colour carries the meaning**. On the right as chips.

Scan the left column of each. The grid gives every label the same start position, so the eye reads down one edge and the values line up against it. Chips put each value in its own box, and the boxes are different widths, so there is no column to scan and every row has to be read individually. The grid is doing the work a table does, without being a table.

Note where this file lives: `core/components/detailLayout/`, not `core/releases/`. Its docblock says it is "shared by the Releases and Variant-definition detail pages so both read as one family". That placement is a claim: this is meant to be a generic detail-screen vocabulary, the first in the studio. If it holds through merge it belongs in the decomposition map as a shared tier. If it drifts release-specific first, that is worth catching while it is still cheap to move.

The panel truncates overflowing values with a tooltip rather than wrapping, which is what keeps the grid a grid at narrow widths.

<!-- @story Rail -->

Reconstructs `core/releases/tool/detail/ReleaseActionRail.tsx` (gated behind `beta.variants` on the branch).

A top-of-page rail carrying an icon-only Edit details, the state-driven primary action, and an overflow menu. It replaces the bottom footer action cluster, which the branch drops.

The argued point is where Edit lives. The docblock is explicit that it is "a defined, always-visible affordance (not an inline hover pencil, not buried in the overflow), which is more discoverable and keyboard-accessible".

Both are shown below. The lower one has the affordance only on hover, which is the pattern the branch is rejecting: a hover pencil is invisible to anyone who has not already guessed it is there, unreachable by keyboard without a focus-visible equivalent, and absent entirely on touch. The cost of making it standing is one always-present icon button.

The same reasoning also moved the action cluster from the footer to the top, which matters more than it sounds: a footer cluster on a scrolling detail page is off-screen exactly when the page is long enough to need it.
