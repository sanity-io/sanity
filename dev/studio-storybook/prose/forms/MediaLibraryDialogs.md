---
source: stories/forms/MediaLibraryDialogs.stories.tsx
title: 'Press photo'
blocks: 1
roundtrip: true
sourceHash: 4ee34df6bd39952a
---

<!-- @component -->

Every asset an editor picks from the Media Library crosses a plugin iframe that Studio reaches only by `postMessage`, and five small components stand between the click and the file landing in a field. The audit finding here is that failure and success paint the same thing on screen: nothing.

|          |                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/studio/assetSourceMediaLibrary/shared/{EnsureMediaLibrary,OpenInSourceDialog,SelectAssetsDialog,UploadAssetDialog,Iframe}.tsx`                                             |
| Tier     | SERVICE. The same asset-service seam `Forms & Input/AssetSourceBrowser` sits in front of: once "Media Library" is picked, `MediaLibraryAssetSource` mounts these five underneath it                       |
| Audit    | 🔴 needs-work (`error-recovery`, `change-visibility`). A plugin iframe with no load or error state, a dialog that never paints a pixel, and a validation banner reachable only if a schema author opts in |
| Patterns | `error-recovery` · `change-visibility`                                                                                                                                                                    |
| Findings | 8                                                                                                                                                                                                         |

All five load or wrap a single Media Library plugin iframe, a separate web app (`media.sanity.io` in production) reached only through `postMessage`. `EnsureMediaLibrary` is the gate before any of them mount, resolving a library id from a project or accepting one directly. `Iframe` is the shared frame underneath. `SelectAssetsDialog` and `OpenInSourceDialog` wrap it in a Studio `Dialog` for picking or viewing an asset; `UploadAssetsDialog` does not, which is the fourth finding below.

**What reading it turned up.**

<details><summary><b>`EnsureMediaLibrary`’s "no library" card never says how to get one.</b></summary>

The `inactive` branch (:26-39) renders a caution `Card` with one line of text, `error.no-media-library-provisioned`, and nothing else: no link, no button, no next step. An author who has never provisioned a Media Library sees exactly the same amount of guidance as one who has.

</details>

<details><summary><b>Two structurally different states render byte-identical: nothing.</b></summary>

`loading` and `active` both fall through every `if` (:26, :41) to the bare `return null` (:60); the `useEffect` for `active` fires `onSetMediaLibraryIds`, but the component itself paints nothing either way. The only visible feedback this gate ever gives an author is failure.

</details>

<details><summary><b>The shared `Iframe` has no load or error handling at all.</b></summary>

Grepped the whole file: no `onLoad`, no `onError`, no timeout. It is a `<Card>` around a bare `<iframe>` (Iframe.tsx:26-42). A slow Media Library, a blocked third-party frame, or a 500 from the plugin app all look identical to "still opening"; there is no code path in this component that could ever tell them apart.

</details>

<details><summary><b>`UploadAssetsDialog` never renders a dialog.</b></summary>

Its own return (UploadAssetDialog.tsx:183) is `<Iframe ref={setIframe} src={iframeUrl} hidden />`: `hidden` is a static prop, not a condition. Open or not, this component paints nothing. `AssetSource.uploadMode`'s own doc comment (`@sanity/types`) confirms the split by design: `'picker'` mode means "the studio opens a native file picker... progress is tracked via the uploader and shown in the studio UI," meaning by the CALLER, not this file. What this component actually does is _write into_ the `uploader` object it is handed (`uploader.updateFile(...)`) in response to plugin `postMessage`s; nothing it renders is what an editor sees.

</details>

<details><summary><b>The validation banner is opt-in, and nothing in the core schema opts in.</b></summary>

`SelectAssetsDialog` only surfaces markers `filterMediaValidationMarkers` (`shared/validation.ts`) keeps: those tagged `__internal_metadata.name === 'media'`. That tag is written by exactly one validator (`objectValidator.ts`'s `media` keyword), which only runs if a schema field's own validation chains `Rule.media(fn)`. The built-in `image`/`file` types (`@sanity/schema/src/legacy/types/{image,file}.ts`) declare their hidden `media` field with no such rule. On a stock schema, `validateSelection` (:86-114) still runs on every selection change, but `validation` is always `[]`; the banner exists only for schemas that explicitly reach for `Rule.media`.

</details>

<details><summary><b>When a `Rule.media` validator does throw, nothing catches it.</b></summary>

The `media` validator (`objectValidator.ts:81-173`) does a live `getClient().withConfig(...).fetch(...)` GROQ read before it ever calls the schema author's own function; a network failure there is wrapped and re-thrown, not swallowed. `SelectAssetsDialog.handleAssetSelection` (:163-176) awaits `validateSelection` with no try/catch, and its only caller is `void handleAssetSelection(...)` inside `handlePluginMessage` (:178-186): an unhandled rejection with no user-visible trace. The Select button just never updates.

</details>

<details><summary><b>None of the three dialogs say which library or project an asset is coming from.</b></summary>

`dialogHeaderTitle` is caller-supplied and, in the one real caller (`MediaLibraryAssetSource.tsx:73-79`), names the FIELD being populated ("Select image for {targetTitle}"), never the source library or org. Someone with more than one Media Library configured has nothing in this component tree telling them which one they are browsing.

</details>

<details><summary><b>`OpenInSourceDialog` has no `open` prop.</b></summary>

Unlike its two siblings, it takes no boolean at all; the real caller (`MediaLibraryAssetSource.tsx:88-105`) mounts and unmounts it entirely via `action === 'openInSource' && assetToOpen && (...)`. "Closing" it in isolation means unmounting the component, not passing `open={false}`; the `Default` story below reproduces that with local mount state rather than a prop.

</details>

**On the portal landmine.** A sibling pass through this storybook found that components taking a `portalElementName: string` prop resolve their portal through @sanity/ui's NAMED elements map, and render nothing inside a plain `OverlayFrame`. None of these three dialogs take that prop: `OpenInSourceDialog` and `SelectAssetsDialog` both use the shared `AppDialog` (`shared/Dialog.tsx`, a bare `styled(Dialog)` with no `portal` prop set), which resolves through the UNNAMED portal slot, exactly what `OverlayFrame` provides (and what the real `MediaLibraryAssetSource.tsx:70` does too, via a plain `<PortalProvider element={...}>`). `OverlayFrame` is the correct harness here; `NamedPortalFrame` is not needed.

> **Why it matters:** every failure mode in this chain, a library that never provisions, a plugin iframe that never loads, a validation check that silently throws, looks the same to an editor: nothing changes on screen. The one thing this component family is reliably good at signaling is success.
