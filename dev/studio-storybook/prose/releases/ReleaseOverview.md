---
source: stories/releases/ReleaseOverview.stories.tsx
title: 'Releases/Release Overview'
blocks: 5
roundtrip: true
sourceHash: 3516499a99d91a98
---

<!-- @component -->

Most of these pieces call their own hook rather than take data as a prop, and the hooks in question run a live GROQ query, so a component cannot show anything real unless the story feeds the same seam the hook reads, not merely the seam a prop would.

|          |                                                                                                                                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/releases/tool/overview/` and `.../overview/columnCells/`                                                                                                                                            |
| Tier     | SERVICE                                                                                                                                                                                                                       |
| Patterns | `empty-states` · `bulk-actions`                                                                                                                                                                                               |
| Coverage | the calendar chrome, the scheduled-drafts empty and upsell surfaces, the confirm-schedule dialog, the two per-row action menus, and the six table-cell renderers under `columnCells/`, companion to `Releases/Overview Parts` |

The rest of the overview screen's parts. That companion page covers the empty state and the four banners; this one covers everything data-fetch-backed instead. The overview root (`ReleasesOverview.tsx`) itself runs the live release and metadata queries and stays out of scope, same as its companion page.

> **Why it matters:** that is a different failure mode from the banners on the companion page, which return null from conditions in their props. Here the component cannot show anything real unless the story feeds the same seam the hook reads. The gallery below does that with a mock document preview store, and one cell gets stuck because of it, for a reason that lies past the render.

<!-- @story CalendarFilterChrome -->

The two pieces either side of the calendar filter itself. `CalendarPopover` is the trigger: a popover on a wide viewport, a dialog on a narrow one (`asDialog`), same content either way, and it manages its own open state, so the stories below open it with a click rather than a prop. `DateFilterButton` is what replaces it once a day is picked: a chip carrying the formatted date, with a close icon that fires `onClear` and plays an exit animation first, which is why removing it from the row is not instant.

<!-- @story SchedulesUpsellPanels -->

One component, two unrelated upsell systems behind it: the `releases` branch reads `useReleasesUpsell()`, the `drafts` branch reads `useSingleDocReleaseEnabled()` **and** `useSingleDocReleaseUpsell()`. Both fall back to a safe default with no upsell data when nothing provides them - which is also why `ReleasesOverview` can mount whichever branch is current without checking first. These stories supply real context values locally (the shared harness does not, since almost every other story wants the plain, non-upselling studio) to make the panel content visible rather than the null it renders by default.

<!-- @story ConfirmScheduledDraftsDialogStory -->

Offers to schedule every active scheduled draft in one server action (`client.action`, batched). The second sentence only appears when at least one of the drafts has an intended publish date already in the past - `releaseFixtures.scheduled` is exactly that fixture (its `intendedPublishAt` is 2023, which is why it also carries the caution warning elsewhere on this page), so the two stories below are the same dialog against two different sets rather than two different components.

<!-- @story ColumnCellGallery -->

Every cell under `overview/columnCells/`, called the way `Table.tsx` calls them (`<Cell datum cellProps sorting />`), against the same two release rows, once each cell's own data fetch has settled. A table rather than six stories, because the point is the comparison.

The finding: `ReleaseDocumentsCounter` renders `documentCount || '-'`. A release with zero documents and a release whose count has not loaded yet are both falsy, so both print the same dash, the middle column below shows a real `0` and an `undefined` side by side, and they are indistinguishable. Nothing downstream of this cell can tell the two states apart either; the count is simply gone.
