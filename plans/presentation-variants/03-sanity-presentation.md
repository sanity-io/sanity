# Plan: emit the selected editing variant from the Presentation tool

- **Repo**: [sanity-io/sanity](https://github.com/sanity-io/sanity) (this monorepo)
- **Area**: `packages/sanity/src/presentation` (the Presentation tool)
- **Rollout phase**: 3 of 4. Depends on phase 1 (`@sanity/presentation-comlink` release with the optional `variant` message fields, repo [sanity-io/comlink](https://github.com/sanity-io/comlink)) and on the `@sanity/preview-url-secret` release from phase 2 (repo [sanity-io/visual-editing](https://github.com/sanity-io/visual-editing)) for the `urlSearchParamPreviewVariant` constant. Can be implemented before those releases using the temporary fallbacks described below.

## TLDR

The studio already supports **editing variants**: the selected variant lands in the perspective provider (`usePerspective().selectedVariantName`, fed by the `variant` router sticky param). Presentation currently ignores it. This plan makes Presentation read the selected variant and pass it down to the preview iframe through the exact same paths `perspective` travels: the iframe URL (`sanity-preview-variant` search param), the comlink messages (`presentation/perspective`, `visual-editing/fetch-perspective`, `loader/perspective`, `loader/query-change`), and the loader refetches (`client.fetch(query, params, {perspective, variant})`).

## Why

- `@sanity/client` is being updated (separately, by the client team — **not part of this work**) to accept a `variant` fetch option, sent to the API as `?variant={variantId}`.
- The frontend side (`@sanity/visual-editing`, `@sanity/core-loader`, `next-sanity`) is being updated in phases 2 and 4 to receive the variant over comlink/URL, persist it as a cookie, and refetch with it.
- Objective once every phase ships: select a variant in the studio → the variant lands in the perspective provider → Presentation passes it to the iframe → the iframe refetches its documents with the variant → the preview updates.

## The shared contract (must match the other repos exactly)

- **Wire value**: the bare variant id, e.g. `Ab12cd34` — exactly the value of `usePerspective().selectedVariantName` / the `variant` router sticky param. Never the full variant document id (`_.variants.Ab12cd34`). `undefined` = no variant selected.
- **URL search param**: `sanity-preview-variant` (constant `urlSearchParamPreviewVariant` from `@sanity/preview-url-secret/constants` once the phase-2 release is available). Only set when a variant is selected — never an empty string.
- **Comlink fields** (from the phase-1 `@sanity/presentation-comlink` release): optional `variant?: string` on `presentation/perspective`, `visual-editing/fetch-perspective` response, `loader/perspective`, `loader/query-change`, `loader/query-listen`, `loader/documents`, `visual-editing/documents`; optional `handlesVariantChange?: boolean` on the `visual-editing/fetch-perspective` request payload.
- **Client option**: `client.fetch(query, params, {perspective, variant})`.

## The end-to-end flow (where this repo sits)

```
Studio URL sticky params: ?perspective=…&variant=Ab12cd34
  → GlobalPerspectiveProvider → PerspectiveProvider → usePerspective().selectedVariantName
  → PresentationTool (this plan)
      ├─ iframe URL: &sanity-preview-variant=Ab12cd34  (initial load, and reloads for
      │    frontends that don't handle in-place variant changes)
      ├─ presentation/perspective {perspective, variant}   → @sanity/visual-editing → next-sanity
      │                                                      cookie + refresh (phases 2+4)
      ├─ visual-editing/fetch-perspective response {perspective, variant};
      │    request payload {handlesPerspectiveChange, handlesVariantChange}
      ├─ loader/perspective {projectId, dataset, perspective, variant} → loaders re-listen
      ├─ loader/query-listen {…, perspective, variant}  ← intake, keyed per variant
      └─ client.fetch(query, params, {perspective, variant, …}) → loader/query-change
           {…, perspective, variant, result} → iframe view updates
```

## Changes in this repo

All paths below are relative to `packages/sanity/src/presentation/`.

### 1. New hook: `usePresentationVariant.ts`

Mirror `usePresentationPerspective.ts` (which adapts `usePerspective()` for Presentation):

```ts
import {usePerspective} from 'sanity'

/**
 * The selected editing variant as a bare variant id (e.g. `Ab12cd34`),
 * or undefined when no variant is selected.
 * @internal
 */
export function usePresentationVariant(): string | undefined {
  const {selectedVariantName} = usePerspective()
  return selectedVariantName
}
```

Notes: `selectedVariantName` is the raw sticky-param value and is available synchronously (no need to wait for `selectedVariant`, the resolved `system.variant` document). No feature-flag gating: when variants are disabled the sticky param is simply never set, so the value is `undefined` and everything behaves exactly as today.

### 2. `PresentationTool.tsx`

- `const variant = usePresentationVariant()` next to the existing `const perspective = usePresentationPerspective({scheduledDraft: params.scheduledDraft})`.
- Add `const [handlesVariantChange, setHandlesVariantChange] = useState(false)` next to `_handlesPerspectiveChange`. **Important**: unlike perspective, do NOT add the `|| loadersConnection === 'connected'` legacy fallback — old loaders in the wild don't understand variants, so a connected loader is no proof the frontend can apply a variant change in place. Only the explicit `handlesVariantChange` capability reported over `visual-editing/fetch-perspective` counts; everything else falls back to a full iframe reload via the URL param (safe degradation).
- Thread new props:
  - `<Preview … variant={variant} handlesVariantChange={handlesVariantChange} />`
  - `<PostMessagePerspective … variant={variant} setHandlesVariantChange={setHandlesVariantChange} />`
  - `<LiveQueries … variant={variant} />`

### 3. `PostMessagePerspective.tsx`

- Props gain `variant: string | undefined` and `setHandlesVariantChange: (payload: boolean) => void`.
- The `visual-editing/fetch-perspective` handler: also call `setHandlesVariantChange(payload?.handlesVariantChange === true)` (inside the same `startTransition`), and return `{perspective, variant}`.
- The perspective-change effect: post `presentation/perspective` with `{perspective, variant}` and add `variant` to the dependency array, so a variant-only change also triggers a post.

### 4. `preview/Preview.tsx`

Mirror the `stablePerspective` freeze for variant:

- `PreviewProps` gains `variant: string | undefined` and `handlesVariantChange: boolean`.
- `const [stableVariant, setStableVariant] = useState<string | undefined | null>(null)` — `null` is the "not frozen yet" sentinel and is distinct from `undefined`, which is a legitimate frozen value ("no variant"). `const urlVariant = stableVariant === null ? variant : stableVariant`.
- In the `previewUrl` memo: `if (urlVariant) { url.searchParams.set(urlSearchParamPreviewVariant, urlVariant) } else { url.searchParams.delete(urlSearchParamPreviewVariant) }` right after the perspective param is set; add `urlVariant` to the memo dependencies.
- Freeze effect mirroring the perspective one: when `handlesVariantChange` becomes true, `setStableVariant((prev) => (prev === null ? variant : prev))`. Net effect: frontends that report `handlesVariantChange` keep a stable iframe `src` and get in-place updates over comlink; older frontends get a full iframe reload whenever the variant changes because `src` changes.
- No `encodeStudioPerspective`-style helper is needed — the variant is a single plain string, and `URLSearchParams` handles encoding.

### 5. Loader pipeline: `loader/LiveQueries.tsx`, `loader/useLiveQueries.ts`, `loader/utils.ts`

- `LiveQueriesProps` gains `variant: string | undefined` (rename locally to `activeVariant` alongside `activePerspective` if that reads better).
- The `loader/perspective` post effect includes `variant: activeVariant` and adds it to the dependency array — this is what makes updated loaders in the iframe re-register their queries when the studio variant changes.
- The `loader/query-listen` intake: pass `data.variant` into the dispatch payload. The fetch must use the **round-tripped** value from the message (like perspective does), not the studio's current value — old loaders never send `variant`, so their queries keep fetching without it.
- `loader/useLiveQueries.ts`: the state entry type, `QueryListenAction` payload, and `queryListen()` all gain `variant?: string`; the cache key call becomes `getQueryCacheKey(payload.perspective, payload.variant, payload.query, payload.params)`.
- `loader/utils.ts`: `getQueryCacheKey(perspective, variant, query, params)` → `` `${perspective}:${variant ?? ''}:${query}:${JSON.stringify(params)}` `` (update the `QueryCacheKey` template-literal type accordingly; both are `@internal`).
- `QuerySubscription` / `useQuerySubscription`: accept `variant`, pass it to `client.fetch(query, params, {…, perspective, variant})`, add it to the fetch effect dependencies, and echo it in the `loader/query-change` post. `turboChargeResultIfSourceMap` needs no changes (source-document overlay logic is perspective/id based).

### 6. Preview URL machine (initial URL + preview-mode enable URL)

- `usePreviewUrlActorRef.ts`: `const variant = usePresentationVariant()` and pass `variant` into `defineResolveInitialUrlActor({…})` and `defineResolvePreviewModeUrlActor({…})`.
- `actors/resolve-preview-mode-url.ts`: accept `variant: string | undefined`; on the enable URL, after the perspective param: `if (variant) url.searchParams.set(urlSearchParamPreviewVariant, variant)`. For the deprecated function-style `previewUrl`, pass `studioPreviewVariant: variant` next to `studioPreviewPerspective` (requires the bumped `@sanity/preview-url-secret` resolver types from phase 2; skip with a TODO if the type isn't available yet — it's a deprecated code path).
- `actors/resolve-initial-url.ts`: same `studioPreviewVariant` addition for the deprecated function-style `previewUrl`.

### 7. Open-in-new-tab and share URLs

- `preview/PreviewHeader.tsx`: thread `variant` (it receives all `Preview` props already; pass `variant` explicitly to `OpenPreviewButton` and `SharePreviewMenu`).
- `preview/OpenPreviewButton.tsx`: `if (variant) url.searchParams.set(urlSearchParamPreviewVariant, variant)` next to the existing perspective param.
- `preview/SharePreviewMenu.tsx`: pass the variant to `setSecretSearchParams(url, secret, redirectTo, encodeStudioPerspective(perspective), variant)` — the optional trailing parameter added to `@sanity/preview-url-secret` in phase 2.

### 8. Types and dependency bumps

- `types.ts`: no changes needed to `PresentationPerspective`; add `variant` to the `PreviewProps` interface (it lives in `preview/Preview.tsx`) and any prop interfaces you extend. Do not add a presentation-owned variant search param — the `variant` sticky param is persisted globally by the router (`STICKY_PARAMS` in `packages/sanity/src/router/stickyParams.ts`), so no `useParams.ts` changes.
- `packages/sanity/package.json`: bump `@sanity/presentation-comlink` and `@sanity/preview-url-secret` to the phase-1/phase-2 releases.
- **Temporary fallbacks if implementing before those releases** (keep CI green, forward-compatible):
  - Comlink payloads: cast at the few `post`/`on` call sites (e.g. `{perspective, variant} as unknown as {perspective: ClientPerspective}` or read `(data as {variant?: string}).variant`) with `// TODO(variant): remove cast once @sanity/presentation-comlink ships the variant fields`.
  - URL param: define `const urlSearchParamPreviewVariant = 'sanity-preview-variant'` in `constants.ts` with `// TODO(variant): import from @sanity/preview-url-secret/constants once released`.
  - `client.fetch` `variant` option: if the installed `@sanity/client` doesn't type it yet, add it through a single typed helper with a cast and the same TODO convention.

### 9. Tests

- New `__tests__/usePresentationVariant.test.ts` mirroring `__tests__/usePresentationPerspective.test.ts` (mock `usePerspective`, assert bare-id passthrough and `undefined` default).
- `loader/__tests__/useLiveQueries.test.ts`: extend cache-key/dedupe cases with variant (same query with different variants = different entries; absent variant keeps today's key shape).
- `machines/__tests__/preview-url.test.ts`: assert `sanity-preview-variant` is set on the enable URL when a variant is selected and absent otherwise.
- Component-level: if `PostMessagePerspective` or `Preview` have existing tests, extend them; otherwise rely on the hook/machine/reducer coverage above.

## Non-goals (explicit follow-ups, do not do here)

- Making the studio-side panes variant-aware: `useDocumentsOnPage`, `useMainDocument`, `useDocumentLocations`, `overlays/schema/PostMessageSchema`, `editor/PostMessagePreviewSnapshots`. These fetch studio-domain data and keep working on perspective alone; variant-awareness there is a separate task.
- `loader/BroadcastDisplayedDocument.tsx` rebroadcast triggers.
- Any `@sanity/client` changes (handled by the client team).

## Todo list

- [ ] Add `usePresentationVariant.ts` hook
- [ ] `PresentationTool.tsx`: read variant, add `handlesVariantChange` state (no loaders fallback), thread props to `Preview`, `PostMessagePerspective`, `LiveQueries`
- [ ] `PostMessagePerspective.tsx`: include variant in `presentation/perspective` post and `fetch-perspective` response; capture `handlesVariantChange`
- [ ] `preview/Preview.tsx`: `sanity-preview-variant` URL param + `stableVariant` freeze gated on `handlesVariantChange`
- [ ] `loader/LiveQueries.tsx` + `useLiveQueries.ts` + `utils.ts`: variant in `loader/perspective` post, query-listen intake, cache keys, `client.fetch`, `loader/query-change` echo
- [ ] `usePreviewUrlActorRef.ts` + `actors/resolve-preview-mode-url.ts` + `actors/resolve-initial-url.ts`: variant on enable URL and function-resolver context
- [ ] `preview/PreviewHeader.tsx` + `OpenPreviewButton.tsx` + `SharePreviewMenu.tsx`: variant on popup/share URLs
- [ ] Bump `@sanity/presentation-comlink` + `@sanity/preview-url-secret` (or add TODO-tagged temporary casts/constants)
- [ ] Tests: `usePresentationVariant`, `useLiveQueries` cache keys, preview-url machine
- [ ] `pnpm build && pnpm test`, `pnpm lint:fix`, `pnpm check:types` all green
- [ ] PR with conventional-commit title, e.g. `feat(presentation): pass selected editing variant to preview frontends`

## Additional knowledge for the agent

- **How variant selection already works in this repo** (do not rebuild any of this): the `variant` router sticky param (see `packages/sanity/src/router/stickyParams.ts`) is read by `packages/sanity/src/core/perspective/GlobalPerspectiveProvider.tsx` and exposed by `PerspectiveProvider` as `selectedVariantName` (raw bare id, synchronous) and `selectedVariant` (resolved `system.variant` document, async). It is set via `useSetVariant` (`packages/sanity/src/core/perspective/useSetVariant.tsx`), which stores the **bare** id (`getVariantId` strips the `_.variants.` prefix). The variants feature is gated by `workspace.beta.variants.enabled`, but reading `selectedVariantName` is safe regardless.
- **Variant is orthogonal to perspective.** It must NOT be merged into `usePresentationPerspective`, the perspective stack, or `encodeStudioPerspective`. It travels as its own optional string next to perspective everywhere.
- **Round-trip principle in the loader pipeline**: Presentation fetches with whatever `perspective`/`variant` the iframe's `loader/query-listen` declared, and pushes `loader/perspective` when the studio selection changes so updated loaders re-register. Old loaders simply never declare a variant — their behavior is unchanged.
- **Reload vs in-place**: the only signal that a frontend handles variant changes in place is `handlesVariantChange: true` on the `visual-editing/fetch-perspective` request payload (sent by `@sanity/visual-editing` versions that have an `onVariantChange` prop wired, e.g. via next-sanity phase 4). Without it, variant changes flow through the iframe `src` and cause a reload — that is correct and intentional.
- Repo commands (see `AGENTS.md` at the repo root): `pnpm build && pnpm test`; single project runs via `pnpm vitest run --project=sanity <path>`; `pnpm lint:fix`; `pnpm check:types`. PR titles must follow conventional commits.
- Reference files to mirror line-by-line: `usePresentationPerspective.ts`, `PostMessagePerspective.tsx`, `preview/Preview.tsx` (stablePerspective block), `loader/LiveQueries.tsx`. When in doubt, do for `variant` exactly what the adjacent line does for `perspective`.
