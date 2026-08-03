---
source: stories/forms/FileUploadChrome.stories.tsx
title: 'Attachment'
blocks: 16
roundtrip: true
sourceHash: 24f584a290c29fe9
---

<!-- @component -->

These ten small pieces are the entire moment-to-moment feedback loop an author watches during an upload, and two of them disagree with themselves or with each other about what state is actually on screen.

|          |                                                                                                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/files/common/` (ten pieces: `AssetSourceDialog`, `UploadDestinationPicker`, `AccessPolicyBadge`, `DropMessage`, `OptionsMenuPopover`, `PlaceholderText`, `UploadProgress`, `UploadWarning`, `FileInputButton`, `FileInputMenuItem`) |
| Tier     | mostly CHROME; `AssetSourceDialog` and `UploadDestinationPicker` are SERVICE (they orchestrate a real asset-source hand-off, not just render one)                                                                                                                         |
| Patterns | `upload-chrome`                                                                                                                                                                                                                                                           |

The shared parts `FileInput` and `ImageInput` are both built from. Neither field owns a drop message, a stale-upload warning, or a private-asset badge, they each mount the same ten small pieces from this folder, so a fix or a defect here shows up in both fields at once.

Each story below is that component read on its own terms: every return traced, every branch reached through the props that actually drive it in production. Two findings surfaced.

<details><summary><b>`PlaceholderText`'s reject-count branch is dead under the only real caller.</b></summary>

`UploadPlaceholder.tsx:178-183` passes `directUploads`, `hoveringFiles`, `readOnly` and `type`, never `acceptedFiles` or `rejectedFilesCount`. Both props exist on `PlaceholderText`, both have real conditional logic for them, and neither can be non-undefined in the one place this component is mounted. The story below reaches that branch anyway, by calling the component directly with props no caller supplies, evidence about the source, not the product.

</details>

<details><summary><b>The same component disagrees with itself about which prop to check first.</b></summary>

`messageIcon` tests `readOnly` before `directUploads === false`; `messageText` tests them in the opposite order. Set both at once, a read-only field whose config also disables direct uploads, which schema and workspace config allow independently, and the icon says "read only" while the text says "can't upload files here". See the matrix story for the mismatched pair, live.

</details>

> **Why it matters:** these are the pieces an author actually watches during an upload, the placeholder that invites a drop, the message that appears while dragging, the bar that tracks progress, the warning that appears if it stalls. None of them is complicated on its own; together they are the entire moment-to-moment feedback loop for whether a file made it, and a mismatch or a dead branch in any one of them is a mismatch an author sees mid-upload, not a defect that only shows up in code review.

<!-- @story AssetSourceDialogNewSelection -->

No bound value, so `value?.asset && observeAsset` (:145) is false and the dialog takes the plain `renderWithoutAsset()` branch (:157): the source component mounts immediately with `selectedAssets: []`. This is the everyday "Upload" or "Browse" click on an empty field.

<!-- @story AssetSourceDialogWaitingForReferencedAsset -->

A bound `value.asset` plus an `observeAsset` that never emits (an `rxjs.NEVER`, standing in for a slow network) takes the `WithReferencedAsset` branch (:145-153). `WithReferencedAsset` itself renders `documentId && asset ? children(asset) : waitPlaceholder` - with no asset yet, this shows the `waitPlaceholder` prop verbatim rather than mounting the source component blind. Nothing else on this page exercises `waitPlaceholder`; without it this state would render nothing at all.

<!-- @story AssetSourceDialogReplacingResolvedAsset -->

The same bound value, but `observeAsset` now resolves synchronously (`rxjs.of(asset)`, standing in for an already-cached read). `WithReferencedAsset` calls `children(asset)`, which is `renderWithAsset` (:132-135): the source component mounts with `selectedAssets: [asset]` pre-filled, so a "Replace" click opens the picker already showing what is bound today.

<!-- @story UploadDestinationPickerEmpty -->

`getAssetSourcesWithUpload(assetSources).length === 0` (:43): the component renders nothing at all, not even a message. A field whose only configured source is browse-only (no `Uploader`, no `uploadMode: "component"`) never shows this picker, even mid-drag.

<!-- @story UploadDestinationPickerEscapeCloses -->

Same picker, played: presses Escape and reads the status line back to confirm `onClose` fired via the global keydown listener rather than a Dialog-native mechanism.

<!-- @story AccessPolicyBadgeCanBeWrong -->

This component takes no `accessPolicy` prop. Both callers (`FileActionsMenu.tsx:73`, `ImageAccessPolicy.tsx:16-22`) gate it themselves with `accessPolicy === 'private'` before mounting it - `useAccessPolicy` actually resolves one of four values (`checking` | `private` | `public` | `unknown`), and only the caller's own `if` stands between "private" and the other three. The two panels below are pixel-identical on purpose: one represents a correctly gated mount, the other a hypothetical caller that forgot the check (or mounted it while the policy was still `checking`). Nothing in this component, or in this story, can tell them apart - the badge always says "Private asset" the moment it exists in the tree.

<!-- @story DropMessageAllAccepted -->

Two files, no `accept` restriction on the schema type: `resolveUploadAssetSources` (called internally, :27-29) accepts both, so `rejectedFilesCount` is 0 and only the upload prompt shows, pluralised via the `-multi` i18n key.

<!-- @story DropMessageMixed -->

The schema type restricts to `.pdf`; one hovering file matches, one (`photo.png`) does not. `acceptedFiles.length > 0` still takes the upload-prompt branch, but the secondary rejected line (:48-61) now renders below it - DropMessage always surfaces a mixed drag, showing both what will upload and what will not. Contrast this with the `PlaceholderText` matrix story below, whose idle-state equivalent does not.

<!-- @story OptionsMenuPopoverOpen -->

The exact composition `FileActionsMenu.tsx` uses (:74-81): a controlled `isMenuOpen` boolean, a `ContextMenuButton` trigger, and a plain `Menu` of `MenuItem`s as children. Played open on mount so the real menu content is visible without a click - the same "Download" / "Remove" pairing a real file card offers.

<!-- @story PlaceholderTextMatrix -->

Every reachable appearance in one grid, captioned with the exact props behind it.

The last two cells are the two findings from the top of this page, made visible: **"some rejected"** only renders `PlaceholderText`'s own reject message when `acceptedFiles` is _entirely empty_ (`acceptedFiles.length > 0` is checked first and returns early, :56-58) - a genuinely mixed accepted-and-rejected drag falls through to the plain default prompt, saying nothing about the rejection at all. Compare it against `DropMessage`'s mixed story above, which always shows both halves. And **"read-only + uploads disabled"** shows the icon/text mismatch directly: `messageIcon` checks `readOnly` first (:32-34) so the icon reads read-only, while `messageText` checks `directUploads === false` first (:47-49) so the text reads upload-not-supported - the one state where both props are true renders an icon and a sentence that disagree.

<!-- @story UploadProgressActive -->

`updatedAt` is "now", well under the 2-minute stale threshold, so the mount-time effect never calls `onStale` - the indicator below stays "no". A live `Cancel` button is present because `onCancel` is supplied.

<!-- @story UploadProgressStaleOnMount -->

Same component, `updatedAt` five minutes in the past. The progress bar and filename render **exactly as above** - same markup, same percentage - because `UploadProgress` has no branch for "stale". The only observable difference is the `onStale` indicator flipping to "yes", which happens because the effect keys off `uploadState.updatedAt` (:21-25) and this mounts with an already-stale value. The effect has no interval and no other trigger, so an upload that goes stale WHILE this component stays mounted - `updatedAt` simply stops changing - never re-fires the check, because nothing changes the dependency it watches. Detection here is a mount-time/prop-change fact, not a running clock. Also `onCancel` is omitted, so the Cancel button is absent - a stalled upload with no way to cancel it from here, until the parent notices `onStale` and offers `UploadWarning`'s own "Clear upload" instead.

<!-- @story UploadWarningIncomplete -->

The copy names the exact wait (`Math.ceil(STALE_UPLOAD_MS / 1000 / 60)` minutes, computed live rather than hardcoded) and says precisely what to do: "You can safely clear the incomplete upload and try uploading again." The one action is `Clear upload`, wired straight to `onClearStale`. Note where this is mounted in the real caller: `FileAsset.tsx:77-81` renders it ABOVE the still-visible `UploadProgress` when `isStale` is true, not instead of it - the stalled progress bar and this warning appear together, which is the pairing the closing story below shows.

<!-- @story FileInputButtonStates -->

Two independent mounts, neither given an explicit `id` - each still works because `useId()` makes every instance unique. This is the real "Upload" button `UploadPlaceholder.tsx:121-133` renders for a single, picker-mode source.

<!-- @story InContext -->

Four of these pieces, in the order an author actually meets them, so the relationship between them reads in one glance rather than across four separate pages: the empty field waits (`PlaceholderText`), a file is dragged over it (`DropMessage`), the upload is in flight (`UploadProgress`), and it stalls (`UploadWarning` - shown, per `FileAsset.tsx:77-90`, ABOVE the still-visible progress bar rather than replacing it, since `UploadProgress` itself never changes its own render for a stale upload).
