---
source: stories/beta/Divergences.stories.tsx
title: 'Book'
blocks: 1
roundtrip: true
sourceHash: 6e43aed0a58f36a7
---

<!-- @component -->

Version control has a hard half: two people edit the same content down different paths, and eventually the paths have to meet. Divergences is how Studio makes that reconciliation legible instead of a merge conflict in the dark.

|          |                                                                                                                                                                                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/divergence/` (+ `core/form/components/FormDivergence*` at the form seam), Studio-only (no DS equivalent)                                                                                                                                            |
| Flag     | `advancedVersionControl.enabled`, default OFF (`core/config/types.ts`, `boolean \| ComposableOption`). When enabled, the form tracks per-node divergences: places where a version document's upstream (published or another release) changed after the version forked from it |
| Tier     | SERVICE. Resolution machinery layered over the document store, history API and `@sanity/diff`; it decorates the form rather than replacing editing core                                                                                                                       |
| Audit    | 🔴 needs-work (`content-versioning`). The benchmark scored Studio's versioning surfaces as under-explained; divergences are the resolution half of Advanced Version Control (chapter-14 content-versioning territory) and currently ship with no in-product narrative at all  |
| Patterns | `content-versioning`                                                                                                                                                                                                                                                          |

A pencil beside each field that moved, and a side-by-side of what changed upstream so the editor can choose. If you are building on Advanced Version Control, this is the surface authors will actually feel.

A divergence is detected per document node by comparing three snapshots: the upstream at the fork point, the upstream head, and the subject head. The editor sees a pencil indicator beside each diverged field; focusing one opens the resolution overlay showing the upstream base-to-head diff (computed live by `@sanity/diff` and rendered by the field's real diff component) with two resolutions: Ignore (mark resolved at the current upstream revision) or Copy from base (take the upstream value).

These stories enter at the navigator seam (`lib/divergenceFixtures.ts`): the divergence records and navigator state are fixtures, but the resolution panel fetches its data through the real paths, `getDocumentAtRevision` against the history endpoint (fork snapshot) and `documentStore.pair.editState` (upstream head), so the diff you see is genuinely computed from the two fixture documents.

> **Why it matters:** every field offers two resolutions and they are not symmetric. Ignore marks the divergence resolved at the current upstream revision without changing your value; Copy from base overwrites your value with the upstream one. An author who reaches for the wrong one loses their edit, so the label and the diff have to make the consequence obvious before the click.
