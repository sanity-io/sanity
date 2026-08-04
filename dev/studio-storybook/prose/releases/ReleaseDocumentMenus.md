---
source: stories/releases/ReleaseDocumentMenus.stories.tsx
title: 'Autumn campaign launch'
blocks: 18
roundtrip: true
sourceHash: 8a95776cef8ce695
---

<!-- @component -->

Hidden and disabled are two different vocabularies for the same idea, whether an action is currently reachable, and this family's two context menus mostly line up the choice with whether an explanation is possible. Mostly.

|          |                                                                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source   | `packages/sanity/src/core/releases/components/documentHeader/contextMenu/` (the menu family), `.../documentHeader/dialog/` (`CopyToDraftsDialog`, `CopyToNewReleaseDialog`) and `.../dialog/DiscardVersionDialog.tsx` (shared with the release detail table) |
| Tier     | SERVICE                                                                                                                                                                                                                                                      |
| Audit    | 🟡 needs-work (`menu-item`, `confirmation-dialog`). A release-locked, permission-fine Discard row disables with no tooltip at all, the one state in this family that disables without saying why. See `CanonicalDiscardLockedNoExplanation` below            |
| Patterns | `menu-item` · `confirmation-dialog`                                                                                                                                                                                                                          |

The right-click menu on a document's version chip, the one place an editor acts on a specific draft, published document, or release version (view the release, copy it elsewhere, discard it), plus the three dialogs that confirm what the menu starts.

`VersionContextMenu` is a pure router: it renders `ScheduledDraftContextMenu` when the chip names a scheduled draft (a cardinality-`one` release) and `CanonicalReleaseContextMenu` for every other perspective (draft, published, or an ordinary release version). Both compose the same `CopyToReleaseMenuGroup`, which in turn nests `CopyToDraftsMenuItem` and a row per release via `VersionContextMenuItem` (storied separately, see `Releases/Version Chips`). `VersionContextMenuDialogs` renders whichever of the three confirmation dialogs the menu opened, keyed by one `dialogState` string.

`CanonicalReleaseContextMenu` hides the whole "copy to release" group when neither releases nor copy-to-drafts apply, and hides Discard entirely on a published document or when the caller sets `isDiscardable={false}`; both are permanent, structural facts about the perspective, not transient permission checks, so there is nothing to explain and hiding is honest. The same Discard item, when the copy-to-release/discard-permission group is otherwise showable, goes disabled-with-tooltip for a permissions gap, it says why on hover, the way CreateReleaseMenuItem always does for its own two disabled states. `locked` is the odd one out: it folds into the same disabled flag the permission check uses, but the tooltip's own suppression reads only the permission flag, so a release-locked, permission-fine Discard row is disabled with no tooltip at all. `ScheduledDraftContextMenu`'s three actions go further: their disabled prop is typed straight off the house MenuItem's plain DOM disabled, and the hook never attaches tooltip props either, so a busy scheduled-draft action cannot explain itself even if a future change wanted it to.

All three confirmation dialogs name the consequence rather than asking a bare question. `DiscardVersionDialog` states it is permanent ("cannot be undone") and names the release; `CopyToDraftsDialog` (title "Draft version already exists") spells out that confirming overrides that existing draft, and its confirm button reads "Yes, override Draft" rather than a generic "Confirm". None of the three reproduces the ledger-113 shape (a confirmation that shows only a count).

`CanonicalReleaseContextMenu`/`ScheduledDraftContextMenu` each call `useHasCopyToDraftOption` once to decide whether to mount `CopyToReleaseMenuGroup`'s drafts row at all, and pass the answer down. `CopyToDraftsMenuItem` then calls the same hook again itself, purely to decide whether to return `null`. The second call always agrees with the first, so it is redundant rather than dead: it runs on every render, it just can never disagree with the answer its own parent already had.

> **Why it matters:** `CopyToDraftsMenuItem` branches on whether a draft already exists to decide whether to confirm first or copy immediately, but the query that answers that question starts unresolved and reads as "no draft" while it loads. A click landing before the query settles takes the immediate, no-confirmation path even when a draft genuinely exists. Contrast `CanonicalReleaseContextMenu`'s own permission checks, which default to a disabled control while unresolved rather than to the more permissive branch: this is the one action in the family that resolves its own race the wrong way.

<!-- @story CanonicalFull -->

A version inside "Hotfix launch": view-release link, the copy-to-release group (with a copy-to-drafts row, since drafts are enabled for this workspace), and an enabled Discard.

<!-- @story CanonicalPublishedHidesDiscard -->

The published chip reuses this same menu. `isPublished` gates the whole `!isPublished && isDiscardable` block, so there is no Discard row here at all - not disabled, absent - because publishing is undone through Unpublish, not this menu.

<!-- @story CanonicalNotDiscardable -->

Not published this time - a draft, with permission to discard it - but the caller passed `isDiscardable={false}`. Same absence as the published case, different reason: this is a caller-level policy, not a fact about the perspective.

<!-- @story CanonicalDiscardDeniedWithTooltip -->

No discard permission. The row stays visible, disabled, tone `critical`, and its `tooltipProps` explains why on hover - the same pattern `CreateReleaseMenuItem` uses for its own two disabled states.

<!-- @story CanonicalDiscardLockedNoExplanation -->

The finding: `locked` and permission both fold into the same `disabled` expression, but the tooltip only reads `hasDiscardPermission`. Here permission is granted and only `locked` is true, so Discard renders disabled with the tooltip suppressed, hover it and nothing explains why a permitted action will not run.

<!-- @story ScheduledDraftActive -->

Publish now, Edit schedule, a link to view all scheduled drafts, the copy-to-release group, then Delete schedule. None of these three actions can attach a disabled reason even when busy - see the component doc for why.

<!-- @story ScheduledDraftPaused -->

`releaseFixtures.scheduledDraft` (active + scheduled + cardinality `one` + a set `intendedPublishAt`) satisfies `isPausedCardinalityOneRelease`. "Edit schedule" is HIDDEN, not disabled - a paused scheduled draft has nothing left to reschedule from this menu.

<!-- @story CopyToReleaseGroupOpen -->

The submenu on its own: a copy-to-drafts row, one row per available release (via `VersionContextMenuItem`), a divider, then "Create release". Locked releases are filtered out before this component ever sees them - by its caller, not by this component.

<!-- @story CopyToReleaseGroupDenied -->

No permission to create a release. The GROUP itself is disabled with a tooltip explaining why - this is the "copy to release" analog of the Discard tooltip above, and it does not have the locked-menu's gap: there is only one reason this can be disabled, so there is only one thing to say.

<!-- @story CopyToDraftsWithExistingDraft -->

`drafts.article-launch` exists in the fixture universe, so `useCopyToDrafts` resolves `hasDraftVersion: true` for real - not asserted. Clicking this row opens the confirmation dialog (`onClick`) rather than copying immediately, because copying would discard that draft first.

<!-- @story CopyToDraftsNoExistingDraft -->

`article-pricing` has no draft in the fixture universe, so `hasDraftVersion` resolves `false` for real. Clicking this row skips the confirmation dialog entirely and calls `handleCopyToDrafts()` directly - see the component doc for the race this creates while the version query is still loading.

<!-- @story RouterResolvesCanonical -->

Rendered with no `isScheduledDraft`, so the router falls through to `CanonicalReleaseContextMenu`. `hasCreatePermission`/`hasDiscardPermission` are computed internally here (`checkWithPermissionGuard`, `useDocumentPairPermissions`) against the seeded mock stores, rather than passed in by hand - both start `null`/`false` and resolve to the seeded `true` a tick after mount, same as a real studio.

<!-- @story RouterResolvesScheduledDraft -->

Same component, `isScheduledDraft` this time and a real `scheduledDraftMenuActions` built by calling `useScheduledDraftMenuActions` (exactly what `useVersionContextMenu` does internally) - the router switches to `ScheduledDraftContextMenu`.

<!-- @story PopoverRightClickToOpen -->

The `translate` offset (`useVersionContextMenu`) positions the popover at the click point rather than anchored to a corner of the trigger, so it opens where you actually clicked inside the card - try right-clicking a different spot.

<!-- @story DialogDiscardVersion -->

The version at `versions.rAsap.article-launch` is real in the fixture universe, so the preview inside resolves for real. Confirm stays disabled until `useTargetDocumentState` reports `ready` - the one place in this family that correctly withholds the destructive action until its own dependency has resolved (contrast the Copy-to-drafts finding above).

<!-- @story DialogCreateRelease -->

Copying the draft into a brand-new release: the release form plus a preview of the source document, keyed by the "add to new release" confirm button (disabled while the form is invalid or its date has drifted into the past).

<!-- @story DialogCopyToDrafts -->

This is the confirmation `CopyToDraftsMenuItem` opens when a draft already exists (see the "existing draft" story above). Title "Draft version already exists", a description that says the existing draft will be overridden, and a confirm button reading "Yes, override Draft" rather than a bare "Confirm" - it names the consequence, not just the question.
