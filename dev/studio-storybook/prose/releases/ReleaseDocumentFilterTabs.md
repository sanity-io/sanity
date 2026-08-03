---
source: stories/releases/ReleaseDocumentFilterTabs.stories.tsx
title: 'Releases/Document Filter Tabs'
blocks: 5
roundtrip: true
sourceHash: ae0d67129c6845e3
---

<!-- @component -->

Five tab counts and a table's row filter both trace back to the same function, so they never disagree about what a document is. What they can disagree about is how many documents are in scope, and typing into the search box is enough to make a tab lie about the count beside its own label.

|          |                                                                                                                                                                |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/releases/tool/detail/components/ReleaseDocumentFilterTabs.tsx`                                                                       |
| Tier     | SERVICE. Holds no content itself, only a view onto the document table beside it                                                                                |
| Audit    | 🟡 needs-work (`filters`). The selected tab can point at a filter that is no longer shown, leaving the table empty with nothing in the tab bar marked selected |
| Patterns | `filters`                                                                                                                                                      |

The row of tabs above a release's document table, All / Added / Changed / Unpublished / Errors, that both counts and filters the documents in a release.

The five tab counts and the table's own filtering both trace back to the same function, `getDocumentActionType`, so a document cannot be counted under one action and filtered under another, they cannot disagree about what a document is. What they can disagree about is how many documents are in scope: the tab counts are computed from the full document set, while the table rows are that same set narrowed by a search box the tabs know nothing about. Type something into the search field and a tab can read "Changed (5)" while showing 2 rows.

> **Why it matters:** `ReleaseSummary` holds the active filter in its own state and only ever changes it from a tab's click; nothing resets it when the release's documents change under it. Select Errors, then have the last error resolve, and the errors tab disappears while the parent's active-filter state stays "errors". The table then shows zero rows and the tab bar shows zero tabs selected, with no visible way back to All other than knowing to click it. See `SelectedTabDisappears` below for a direct repro.

<!-- @story AllCategories -->

One document deliberately does double duty: it is both `changed` (has a published counterpart) and carries a validation error, so it is counted under both the Changed tab and the Errors tab. That overlap is correct, not a bug - Errors is a cross-cutting flag on top of the add/change/unpublish classification, not a fifth mutually-exclusive bucket.

<!-- @story SelectedTabDisappears -->

`activeFilter="errors"` handed to a document set with zero errors. In the real studio this is the state you land in a beat after the last error on a release resolves while the Errors tab is still selected. The Errors tab does not render (its count is zero), so nothing in this tab bar reads as selected - the component gives no sign that a filter is even applied, let alone which one. Paired with `ReleaseSummary.tsx`, this is also the moment the document table below goes empty with no visible cause.

<!-- @story HiddenArchivedOrPublished -->

The `releaseState` guard (source line 34), checked before either of the other two and documented in the source as an early return for perf. Filtering by add/change/unpublish stops being a meaningful question once a release can no longer be edited, so the tabs disappear regardless of how many documents it has - shown here with a mixed document set that would render every tab if the release were still active.

<!-- @story SelectedToneVsUnselected -->

Tone logic (source lines 95-105): every non-error tab is plain `default` tone unless it is the selected one, when it takes on its own tone (positive for Added, caution for Changed, critical for Unpublished). Errors is the one exception - it stays `critical` whether selected or not, so an unresolved error keeps its alarm colour even while a reader is looking at a different tab. Two identical document sets, only `activeFilter` differs.
