---
source: stories/structure/ChangesInspector.stories.tsx
title: 'Article'
blocks: 2
roundtrip: true
sourceHash: 44d2dab90fb19685
---

<!-- @component -->

A broken connection tells the truth on one tab of this panel and stays silent on the other, for the exact same document. This page is the frame around Review Changes, not the diffs themselves: the tab strip that switches between a plain revision list and a from/to comparison, the two selectors that populate that list, and the two panels that render, or decline to render, a diff.

|          |                                                                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/structure/panes/document/inspectors/changes/`: `ChangesTabs.tsx`, `ChangesInspector.tsx`, `EventsInspector.tsx`, `HistorySelector.tsx`, `EventsSelector.tsx` |
| Tier     | SERVICE. Reviewing history enriches editing but nothing here is the act of editing itself                                                                                         |
| Audit    | 🔴 needs-work (`similarity`). See `TranslogErrorVsNoChanges` below                                                                                                                |
| Patterns | `similarity` · `empty-states`                                                                                                                                                     |

<details><summary><b>Which inspector an editor sees is a workspace config flag, not a menu choice.</b></summary>

The tab strip checks a beta feature flag twice to pick the legacy selector and inspector (the deprecated timeline/translog model) or the newer selector and inspector (the events-API model), and the document pane provider reads the same flag one layer up to decide which history store even backs the pane. An editor cannot toggle this from inside the product; it is set once, per workspace, in config.

</details>

<details><summary><b>No document a reader opens ever shows both.</b></summary>

The two selectors and the two panels are mutually exclusive alternates, not complementary views: the legacy selector walks chunks from the deprecated translog-based store, the newer selector walks events from the newer events API. Same job, picking a point in time, two unrelated data models, picked once at the workspace level.

</details>

<details><summary><b>Empty history reads differently depending on which path is active.</b></summary>

The two are meant to be interchangeable: the legacy inspector falls to a generic "No changes" message shared with every other empty-diff case, while the events inspector has its own dedicated check, with its own "no document history" title and description, checked before the tab renders anything else. Two different empty-state messages for what is, from an editor's chair, the same situation: a document with no history yet.

</details>

> **Why the translog/error finding matters:** the review inspector checks for an error before checking whether a diff exists, the same branch a document with a real, boring, empty history reaches. The history selector, reading the identical error off the identical pane, shows a properly critical-toned error message instead. Open the History tab on a broken connection and the panel is honest; switch to Review and it goes quiet. The newer events inspector does not have this problem: its own error branch renders a dedicated error component.

Every story below except `ReleaseVersion` mounts the real document pane with the changes inspector already open via router params, the same params a click on Review Changes would set. `ReleaseVersion` mounts `ChangesInspector` in isolation instead: its release-version branch needs a release perspective selected, not a release document resolved, and the relevant hooks are plain context reads with no fallback logic, so the context values are supplied directly rather than routing a whole release through the pane machinery. Two client variants inject a real failure at the exact seam each store fetches from, rather than faking a UI state. Revision and event list contents, an actual populated timeline, are out of scope for this harness tier, the same boundary `Document Pane/Document Pane`'s own page draws.

<!-- @story TranslogErrorVsNoChanges -->

Read left to right: the same broken connection, the same document, two tabs of the same panel. One tells you it failed. The other tells you nothing happened.
