---
source: stories/releases/ReleaseMenuButton.stories.tsx
title: 'Article'
blocks: 20
roundtrip: true
sourceHash: e884b91c78f478e6
---

<!-- @component -->

Every permission-gated row in this menu stays disabled with an explanatory tooltip rather than disappearing, the same choice CreateReleaseMenuItem makes. But that restraint does not extend everywhere: confirmation itself is not uniform across the six mutating actions this menu can take, and one of them has no permission check at all.

|          |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/releases/tool/components/ReleaseMenuButton/`, `packages/sanity/src/core/releases/components/` (top level), `packages/sanity/src/core/releases/tool/` (top level), `packages/sanity/src/core/releases/tool/components/` (top level)                                                                                                                                                                                                                                                        |
| Tier     | SERVICE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Patterns | `destructive-confirmation` · `menu-item`                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Coverage | the ellipsis menu and everything it is built from: the item list (`ReleaseMenu`), the button/popover/confirm-dialog shell (`ReleaseMenuButton`), a toast-only link (`DuplicateReleaseToastLink`), the confirm-dialog preview card (`ReleasePreviewCard`), plus the shared pieces the release surfaces reuse: a pill button wrapper (`Chip`), the custom-action hook resolver (`ReleaseActionsResolver`), the schedule-time picker (`ScheduleDatePicker`), and the clickable document row (`ReleaseDocumentPreview`) |

`MenuNoPermission` below shows the whole menu in the hidden-or-disabled state at once.

Delete, archive and duplicate all open a dialog naming the release (via `ReleasePreviewCard`) plus a document count ("This will delete 3 document versions."). But that count is all it says, not which three, matching the pattern ledger 113 found in the revert dialog one level up. And when the release is empty, the count sentence does not render at all, the dialog is just the header and the preview card (`ConfirmDeleteEmptyRelease`). Unschedule and unarchive skip confirmation entirely: their `confirmDialog` config is `false` for both, and `ReleaseMenuButton`'s own effect fires the action the instant it is selected. Nothing in the row itself signals which kind of click an item is (`UnscheduleHasNoConfirmation` shows the same click producing no dialog at all, next to ones that do).

Does anything proceed past a permission check still in flight? No, for the six checked actions. Every permission flag in `ReleaseMenu` starts life as a nullable boolean, and every place it gates a `disabled` prop reads null as falsy, so the row is disabled from the very first paint, before the async permission check has even settled. `ButtonPermissionCheckNeverResolves` proves this by freezing the check forever: the button stays disabled indefinitely rather than opening a window where it is clickable.

Tracing every fixture release state against both values of `ignoreCTA`, at least one menu item always survives; the closest to empty is `MenuLocked`, where Archive renders disabled-with-tooltip alongside a live Unschedule and Duplicate. A menu with zero rows is not a state this component reaches on its own.

> **Why it matters:** unschedule has no permission check at all. There is no permission state for it and its disabled prop is just the caller-supplied flag, every other mutating action in this menu is gated on a resolved grant, this one is not gated on anything.

<!-- @story MenuAsapActive -->

An active asap release. `ActionsOrder` puts publish first for this type. Publish, Duplicate, Archive - Unschedule and Delete are both null (state is not scheduled/scheduling, and not archived/published).

<!-- @story MenuScheduledActive -->

`releaseType: "scheduled"` flips `ActionsOrder` to `[scheduleMenuItem, publishMenuItem]`, so Schedule appears before Publish - the only visible effect of the type on an otherwise-identical active release. Duplicate and Archive follow, same as the asap case.

<!-- @story MenuLocked -->

A release in the `scheduled` state (committed, not just intended) is locked: Unschedule appears, Duplicate is live, and Archive renders but disabled - its tooltip explains why (`action.archive.tooltip`) rather than the permission-error copy, because here the block is the lock, not the grant.

<!-- @story MenuArchived -->

Archived releases offer exactly two rows: Unarchive and Delete.

<!-- @story MenuPublished -->

A published release offers exactly one row: Delete. Everything else nulls out (archive/unarchive returns null for `state === "published"`, duplicate returns null for published or archived, publish/schedule return null for non-active states, unschedule is not scheduled).

<!-- @story MenuNoPermission -->

The same active-asap menu, seeded with `canPerformReleaseActions: false`. Every row still renders; each is disabled and its tooltip names the missing grant (`permissions.error.archive`, `.duplicate`, and so on). Hidden rows would give an editor nothing to ask about - a disabled row with a reason at least names who to ask.

<!-- @story ButtonClosed -->

The default, unopened state: one bleed-mode ellipsis button.

<!-- @story ButtonOpenMenu -->

Clicked open, on an active asap release: Publish, Duplicate, Archive.

<!-- @story ButtonConfirmDelete -->

Delete opens a confirm dialog: the `ReleasePreviewCard` names the release, and the description names a count - "This will delete 3 document versions." - not which three.

<!-- @story ButtonConfirmDeleteEmptyRelease -->

The same dialog with `documentsCount={0}`. `{!!documentsCount && <Text>...}` is false, so the count sentence does not render at all - the confirmation is the header and the preview card, nothing naming what (if anything) is lost.

<!-- @story ButtonUnscheduleHasNoConfirmation -->

Unschedule looks exactly like every other row until you click it. `RELEASE_ACTION_MAP.unschedule.confirmDialog` is `false`, so `ReleaseMenuButton`'s effect fires the action immediately - no dialog, and (unschedule has no `toastSuccessI18nKey`) no toast either on success. The play function clicks it and asserts no `[data-testid$="-dialog"]` ever appears, the direct contrast to `ButtonConfirmDelete` above.

<!-- @story ButtonPermissionCheckNeverResolves -->

The permission promise never settles (see `StuckPermissionCheck` above). Every row that depends on a resolved grant stays disabled indefinitely, because the `useState<boolean | null>(null)` default reads as falsy - there is no window, however brief, where the row is clickable while the check is still pending.

<!-- @story ToastLinkWithReleaseId -->

The shape `handleDuplicate` actually produces (`{releaseId}`). Clicking the link parses the release id back out of the document id and navigates to it - watch the line below the card update.

<!-- @component -->

Chip has no logic of its own: every prop it receives is forwarded straight to the underlying `@sanity/ui` `Button`, and its only job is the rounded, bordered shell `VersionChip` builds a version indicator from.

|        |                                                                                            |
| ------ | ------------------------------------------------------------------------------------------ |
| Source | `packages/sanity/src/core/releases/components/Chip.tsx`                                    |
| Tier   | SERVICE. A shared visual primitive for the release/version chips, not itself release-aware |

<!-- @component -->

This is the piece that turns a workspace's `source.releases.actions()` config into rows `ReleaseMenuButton` appends after its own built-in ones. It uses the same hook-collection pattern document actions use: each configured action is called like a hook, its returned description collected, and the whole set reported once via `onActions`, an effect, not a return value; the component itself renders `null` unless a `children` render prop is supplied.

|        |                                                                           |
| ------ | ------------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/releases/components/ReleaseActionsResolver.tsx` |
| Tier   | SERVICE                                                                   |

This story supplies `children` to make the otherwise-invisible resolution visible: two fixture actions, one plain and one that disables itself with a reason when the release is empty, both real `ReleaseActionComponent` functions, called with the real `release`/`documents` props.

<!-- @story DatePickerWithValue -->

A fixed future instant, formatted in the current time zone. The globe button opens the shared time-zone dialog, storied in full under `Scheduling/Time Zone Dialog`.

<!-- @component -->

Loading and resolved to nothing are not the same signal, but this component renders them close to identical, and the title is the only thing on the row that tells two different documents apart at all.

|        |                                                                                                                                                                                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/releases/tool/components/ReleaseDocumentPreview.tsx`                                                                                                     |
| Tier   | SERVICE                                                                                                                                                                            |
| Audit  | 🟡 needs-work. Matches the pattern ledger findings 136-138 (loading/empty) and 106 ("Untitled" covering unrelated situations) found elsewhere, confirmed here in a third subsystem |

This is the clickable row for one document inside a release: an avatar/title/subtitle preview wrapped in an `IntentLink`, wired to the real `useDocumentPreviewValues` against the seeded preview store.

The loading flag is the only thing that gates the skeleton, and it turns false the moment the store emits anything at all, including an empty snapshot for a document that no longer exists. The resolved value is never actually null in practice, it always returns the four-field object, just with every field undefined when nothing resolved, so an all-undefined object gets spread into the preview with the loading flag false. Downstream, the title default cannot tell "this document was deleted out from under the release" from "a real document nobody named yet", both skip the skeleton and land on the same word. `DocumentPreviewResolvedToNothing` and `DocumentPreviewTwoUntitledLookAlike` below are the two shapes of that same collapse.

The preview receives exactly title, subtitle, media and description plus presence/placeholder flags, no document id, no revision, nothing type-specific beyond a shared fallback icon. For a document type whose only field is a title (as most are), two different documents that share a title, or that are both untitled, are pixel-identical here. `DocumentPreviewTwoUntitledLookAlike` puts two distinct fixture documents side by side to show it.

> **Why it matters:** a deleted document and an unnamed one render the same row, with no error, no placeholder shimmer, nothing marking them apart. An editor scanning a release cannot tell "this is gone" from "nobody named this yet" without clicking into every row that looks blank.

<!-- @story DocumentPreviewResolvedToNothing -->

`article-deleted` is never added to the preview store, so the mock resolves it the way a genuinely missing document resolves: synchronously, to nothing (`observePaths` returns `null` for an unknown id - see `lib/mockDocumentPreviewStore.ts`). `previewLoading` settles to `false` immediately, so this is NOT the loading skeleton - it is the steady-state render of a row whose document is gone, and it reads exactly like `DocumentPreviewTwoUntitledLookAlike` below: a title-less card with no error, no placeholder shimmer, nothing marking it apart from a document that was simply never named.

<!-- @story DocumentPreviewTwoUntitledLookAlike -->

Two real, different documents in the same release (`article-alpha`, `article-beta`) - neither has ever had a `title` field set. Both fall through `TemplatePreview`'s `title = "Untitled"` default identically. Nothing else in the row (id, revision, an icon) surfaces to tell them apart; an editor scanning this release sees two identical rows and has to click into each one to find out they are different documents.
