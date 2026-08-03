---
source: stories/releases/ReleaseDetail.stories.tsx
title: 'The launch announcement'
blocks: 25
roundtrip: true
sourceHash: 623079a40053e049
---

<!-- @component -->

`ReleaseDetail.tsx` itself takes no props and reaches straight for live data, so it is not storied here; every piece under it takes its release and its documents as props instead, so the screen can be examined piece by piece rather than as a whole.

|          |                                                                                                                                                                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/releases/tool/detail/`                                                                                                                                                                                                                                                                                                        |
| Tier     | SERVICE                                                                                                                                                                                                                                                                                                                                                 |
| Coverage | the header and its copy menu, the details panel (pin, type picker, title/description editor, error and warning banners), the footer (status pills and the publish/schedule/revert action), the activity panel and its virtualised event list, and the two pieces the document table renders per row (the row action menu and the truncating type label) |

The parts a release detail screen is assembled from. `ReleaseDetail.tsx` reaches straight for live data (`useActiveReleases`, `useArchivedReleases`, `useReleaseDocuments` running a real GROQ query, `useReleaseEvents`, and a `releaseId` read off `router.state` that this harness's fixed, empty router state can never supply), the same standing rule as the releases overview root. The In Context story at the end assembles the pieces the way `ReleaseDetail.tsx` stacks them, as the closest stand-in for the screen.

> **Why it matters:** a release detail screen carries three different kinds of "something is wrong" (a publish/schedule error, a missing permission, one invalid document) plus an activity feed that mixes two data sources, the translog and the Events API. Each is a distinct visual state below, because collapsing any pair of them into one rendering would leave the editor unable to tell why the screen is blocked.

<!-- @story Header -->

A titled, open release, activity panel closed. The back button always reads "Releases" regardless of state; only its destination changes underneath (open releases go to the active list, everything else to the archived one).

<!-- @story HeaderUntitledWithActivityOpen -->

Two independent branches at once: no title set, so the placeholder text renders at half opacity instead of an empty header; and the activity button is `selected`, which is what the caller sets when the inspector panel below is showing.

<!-- @story CopyActions -->

The header's share menu: copy link, copy id, copy title. Open it to see all three; each pushes a toast and logs telemetry rather than doing anything to the release itself, so it is safe to leave enabled on every release state.

<!-- @story DetailsActive -->

An open, healthy release: the pin toggle, the type picker, the validation progress indicator, and the title/description editor. Nothing below is an error or a warning, so neither of those cards is present.

<!-- @story DetailsPublishFailed -->

The release carries an `error` (the asap-failed fixture), so `shouldDisplayError` is true: an inline summary line appears in the toolbar row and the full error card (with the raw message inside a collapsible `Details`) appears below the editor.

**Not exercised:** the permission-missing sibling of this branch needs `useReleasePermissions().checkWithPermissionGuard` to resolve `false`, which means a second `WithStudioProviders({canPerformReleaseActions: false})` harness. Left as a documented gap rather than doubling this file's workspace compilation for one card.

<!-- @story DetailsArchived -->

An archived release. The pin toggle and type picker are gone (there is nothing left to pin or reschedule), and `ArchivedReleaseBanner` appears at the bottom explaining the retention policy in their place.

<!-- @story DetailsEditorOpen -->

An active release: the title and description fields are editable. Typing debounces 200ms before calling `updateRelease`, which this harness's mock client accepts silently.

<!-- @story DetailsEditorReadOnly -->

A published release. `getIsReleaseOpen` is false, so the mount effect never even asks whether the user has update permission: the fields are disabled unconditionally, because a published release's title is a record of what shipped, not something left open to edit.

<!-- @story TypePickerStates -->

The three open release types, each with its own icon and tone: asap (a bolt, caution), scheduled with a publish date (a clock, suggest), undecided (a dot, neutral). Click any of them to open the popover and see the same `TabList` plus, for scheduled, the date input and calendar.

<!-- @story TypePickerLockedAndPublished -->

Two states that stop being an editable control. Locked: the release is actually `state: 'scheduled'`, not merely typed that way, so the button is disabled with a tooltip explaining why. Published: the component renders no button at all, only a static pill, because a published release's timing is history rather than a setting.

<!-- @story DateInputStates -->

The date field the type picker's "scheduled" tab embeds. With a date it shows the formatted value; with none it is blank, waiting for the calendar or a typed date to fill it in.

<!-- @story ArchivedVsPublishedBanner -->

Same component, two headings. Archived reads "this will be removed"; published reads differently because nothing is scheduled for removal, it already shipped.

**Harness note:** the retention sentence depends on `useProjectSubscriptions`, which requests `/subscriptions/project/:id`. This harness's mock client has no data registered for that path, so the request resolves to `projectSubscriptions: null` and `retentionDays` is `undefined`, the honest "we do not know the retention window" state rather than a fabricated one.

<!-- @story StatusItemsStates -->

The footer's left-hand status pills. Every release shows "created"; a release that has since published, archived, or unarchived gets a second pill next to it rather than losing the first, so the footer reads as a short history rather than a single current status.

<!-- @story FooterStates -->

The same footer, four releases. Asap shows "Publish all"; a release with an undecided-then-scheduled date shows "Schedule"; published shows "Revert"; archived shows no action at all, only the status pills and the overflow menu, because there is nothing left an archived release can do.

<!-- @story ActivityListMixedEvents -->

Seven event types in one feed: created, a document added (with its preview card underneath), scheduled, a document discarded (also previewed), edited, published, archived. This is what `ReleaseDashboardActivityPanel` renders inside, and it is virtualised, so the list needs a real scroll container rather than an auto-height one, hence the fixed-height frame.

<!-- @story ActivityListLoadingMore -->

`hasMore` is true, so a loader row is virtualised in below the last event. Scrolling to it is what triggers `loadMore` in the real component (the `useEffect` at lines 92-98); here it is a permanent fixture rather than a live pagination cursor.

<!-- @story ActivityPanelOpen -->

The resizable panel the header's activity button toggles, holding the same mixed-event feed as the list story above. Its width is draggable between 320 and 800px.

<!-- @story ActivityPanelClosed -->

`show={false}`. `AnimatePresence` has nothing to animate out because nothing was ever rendered in: the whole panel, including its own padding and border, is absent rather than collapsed to zero width. The dashed frame below is the story stage, not the component.

<!-- @story ActivityPanelErrorAndLoading -->

Two states that only appear before any event has arrived: an errored feed shows a caution card instead of a silent empty list, and a still-loading feed shows a loader instead of looking finished with nothing to show. Once even one event lands, both cards step aside for the list.

<!-- @story DocumentActionsMenu -->

The overflow menu each document-table row carries: discard the version, or unpublish once the release goes live. The type (`author`) is registered in this harness's schema, so `GuardedDocumentActions` hands off to the real menu.

<!-- @story DocumentActionsUnknownType -->

A document whose `_type` is not registered in the schema at all, the guard branch at lines 144-152. Rather than crash trying to look up permissions for a type that does not exist, the component renders a disabled button with a "type not found" tooltip and stops there. A real studio would only reach this for a document type removed from the schema after documents of that type were released.

<!-- @story DocumentTypeLabel -->

The type-column cell in the document table: the schema type's title, resolved live through `useSchema()`. "Author" is short enough not to truncate; the tooltip-on-truncate branch is a real ResizeObserver measurement rather than a prop and is not exercised here (see the note above).

<!-- @story AddDocumentSearchOpen -->

The popover `ReleaseSummary`'s "Add document" button opens, reusing the navbar search machinery scoped to this release: results already in the release are disabled rather than hidden, so a document that was already added is recognisable rather than missing. See `Search/Search Popover` for the harness this borrows and why it runs the `groqLegacy` strategy offline.

<!-- @story InContext -->

Header, details panel, footer and activity panel, stacked the way `ReleaseDetail.tsx` composes them around whatever `ReleaseSummary` renders in the middle (see `Releases/Release Summary` for that piece). Toggle in your head: everything here is prop-driven, so this assembly is possible without the screen's own data-fetching root.
