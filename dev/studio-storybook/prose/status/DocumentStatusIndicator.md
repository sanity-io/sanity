---
source: stories/status/DocumentStatusIndicator.stories.tsx
title: 'Document Status/Status Indicator'
blocks: 1
roundtrip: true
sourceHash: 4c141b777b542821
---

<!-- @component -->

This component is where the single most-cited status defect of the 8-product benchmark lives: state is carried by colour alone, on dots of identical shape and size, and in grayscale or to a colour-blind editor scanning a list, published and draft are indistinguishable.

|          |                                                                                                                                                                                                                                                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/components/documentStatusIndicator/DocumentStatusIndicator.tsx`, Studio-only, no DS equivalent                                                                                                                                                                                                                     |
| Tier     | CHROME. A presentational status glyph: it maps each live document state to a themed dot colour and renders a small row of them. It derives its inputs from the draft model and active releases, but its output is pure visual signalling                                                                                                     |
| Audit    | 🔴 needs-work (`similarity`, `draft-publish-lifecycle`). This component is where the most-cited status defect lives: status is conveyed by colour-only dots of identical shape and size (a 5px circle whose only variable is `--card-icon-color`). Published-vs-draft is unreadable in grayscale or to a colour-blind editor scanning a list |
| Patterns | `similarity` · `draft-publish-lifecycle`                                                                                                                                                                                                                                                                                                     |

The tiny row of coloured status dots, the compact, label-less lifecycle signal seen next to list items and tabs. This is the smallest way Studio signals a document's state: a 5px dot, one per live state, toned by status, published is positive, draft is caution, each active release version toned by its release type. It shows up wherever there is no room for words: list rows, tabs, tight lockups where a full label would not fit.

Each dot maps a status to a badge colour: published to `positive`, draft to `caution`, and one dot per active release version toned by release type (`asap` / `scheduled` / `undecided`). The draft dot only shows when the workspace draft model is enabled; version dots only show for releases in the active-releases store, inert by default in this harness, so most stories render the published/draft matrix, while the `WithVersions` story seeds the store (`WithStudioProviders({releases})`) so all three release-type dots render through the real `useActiveReleases()` path. This is the compact sibling of Document Status/Document Status, which adds the missing text label.

> **Why it matters:** the Current/Recommended pair below shows the fix in place, a distinct icon shape plus a label per state, not just a re-tinted dot.

The page closes in context: the status dot scanned down a real author list, Austen published, Tolstoy edited, Lem draft-only.
