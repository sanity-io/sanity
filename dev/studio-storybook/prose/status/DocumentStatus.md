---
source: stories/status/DocumentStatus.stories.tsx
title: 'Document Status/Document Status'
blocks: 1
roundtrip: true
sourceHash: 44ec66d5d52d41ab
---

<!-- @component -->

The text label and timestamp are DocumentStatus's saving grace, but the leading glyph is the same circle for every lifecycle state, told apart by hue alone; strip colour and Published and Draft are identical.

|          |                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source   | `packages/sanity/src/core/components/documentStatus/DocumentStatus.tsx`, Studio-only, no DS equivalent                                                                                                                                                                                                                                                                                                                                                       |
| Tier     | SERVICE. It composes several domain reads (the workspace draft-model flag, active releases, i18n, relative-time formatting) into a single lifecycle readout; not a pure atom, not core editing machinery                                                                                                                                                                                                                                                     |
| Audit    | 🔴 needs-work (`draft-publish-lifecycle`, `working-memory`, `similarity`). The CMS chapter marks the draft→published lifecycle as under-surfaced. DocumentStatus is the strongest existing answer: it keeps the position visible with a text label and timestamp at all times, so it largely satisfies draft-publish-lifecycle/working-memory. The residual similarity weakness is that its leading glyph is a same-shape coloured dot, distinguished by hue |
| Patterns | `draft-publish-lifecycle` · `working-memory` · `similarity`                                                                                                                                                                                                                                                                                                                                                                                                  |

The multi-line readout of where a document sits in its lifecycle: a labelled line each for Published, Draft, and every active release version. Editors live by one question: is what I'm looking at published, still a draft, or scheduled in a release? DocumentStatus is the fullest answer Studio gives, a stacked readout with one line per live state, each pairing a glyph with a translated "Published 3 days ago" / "Edited 8m ago" phrase. Because it keeps that position visible with real words and a timestamp at all times, it is the strongest thing Studio has going for the otherwise under-surfaced draft-to-published lifecycle.

Renders one line per live state, Published, Draft, and one per active release version, each as a `ReleaseAvatar` glyph plus a translated "Published {date}" / "Edited {date}" phrase. The draft line only appears when the workspace has the draft model enabled (`document.drafts.enabled`), and version lines only render for releases present in the active-releases store. That store is inert by default in this harness, so most stories render the draft/published matrix; the `WithVersions` story seeds it (`WithStudioProviders({releases})`) so release lines render live, title, release-type glyph tone (`asap` / `scheduled` / `undecided`) and created/edited phrasing all resolved through the real `useActiveReleases()` path.

> **Why it matters:** the Current/Recommended pair keeps the copy and gives each lifecycle state a distinct icon shape, so the status survives a grayscale render and not only the tinted dot.

The page closes in context: the full lifecycle readout under the Leo Tolstoy document header, published, draft-edited, and three release versions at once.
