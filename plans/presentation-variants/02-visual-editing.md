# Plan: pass editing variants through preview-url-secret, loaders, and visual-editing

- **Repo**: [sanity-io/visual-editing](https://github.com/sanity-io/visual-editing)
- **Packages touched**: `packages/preview-url-secret` (`@sanity/preview-url-secret`), `packages/core-loader` (`@sanity/core-loader`), `packages/react-loader` (`@sanity/react-loader`), `packages/svelte-loader` (`@sanity/svelte-loader`), `packages/visual-editing` (`@sanity/visual-editing`)
- **Rollout phase**: 2 of 4. Depends on phase 1: a released `@sanity/presentation-comlink` whose message types include the new optional `variant` fields (repo [sanity-io/comlink](https://github.com/sanity-io/comlink)). Blocks phase 4 (`next-sanity`). The `@sanity/preview-url-secret` part also blocks phase 3 (Sanity studio monorepo).

## TLDR

Sanity Studio now supports **editing variants** (content variants a document can be attached to). The selected variant must flow from the studio's Presentation tool into preview frontends following the exact same paths `perspective` uses today: a preview URL search param, comlink postMessages, loader query registration/refetch, and an `onVariantChange` callback so frameworks (next-sanity) can persist it in a cookie. This plan adds a parallel `variant` value beside every `perspective` touchpoint in this repo. Everything is optional and backward compatible.

## Why

- The studio stores the selected variant in its `variant` router sticky param; the Presentation tool (in the `sanity` monorepo, phase 3) will start emitting it via the iframe URL (`sanity-preview-variant`) and the comlink messages (`presentation/perspective`, `loader/perspective`, etc.).
- `@sanity/client` is being updated (separately, by the client team — **not part of this work**) to accept a `variant` option in fetch, exactly like `perspective`, sent to the API as `?variant={variantId}`.
- The end goal: select a variant in the studio → Presentation passes it down → the frontend persists it (cookie, phase 4 in next-sanity) and refetches with `client.fetch(query, params, {perspective, variant})` → the preview updates.

## The shared contract (must match the other repos exactly)

- **Wire value**: the bare variant id, e.g. `Ab12cd34` — never the full variant document id (`_.variants.Ab12cd34`). `undefined` = no variant selected (base content).
- **URL search param**: `sanity-preview-variant` → new constant `urlSearchParamPreviewVariant` in `@sanity/preview-url-secret/constants`. Only present when a variant is selected.
- **Cookie name**: `sanity-preview-variant` → new constant `variantCookieName` in `@sanity/preview-url-secret/constants` (the cookie itself is written by next-sanity in phase 4; this repo only owns the constant, mirroring `perspectiveCookieName`).
- **Comlink fields** (already added to `@sanity/presentation-comlink` in phase 1): optional `variant?: string` on `presentation/perspective`, `visual-editing/fetch-perspective` (response), `visual-editing/documents`, `loader/perspective`, `loader/query-change`, `loader/query-listen`, `loader/documents`; optional `handlesVariantChange?: boolean` on the `visual-editing/fetch-perspective` request payload.
- **Callbacks**: `onVariantChange?: (variant: string | undefined) => void` on `@sanity/visual-editing`, `onVariant?: (variant: string | undefined) => void` on `@sanity/core-loader` / `@sanity/react-loader` live mode.

## The end-to-end flow (where this repo sits)

```
Studio Presentation tool
  ├─ iframe URL: ?sanity-preview-secret=…&sanity-preview-perspective=…&sanity-preview-variant=Ab12cd34
  │     → preview app enable route calls validatePreviewUrl (@sanity/preview-url-secret)
  │       which now also returns studioPreviewVariant → next-sanity sets the cookie (phase 4)
  ├─ comlink presentation/perspective {perspective, variant}
  │     → @sanity/visual-editing usePerspectiveSync stores it in overlay state and calls
  │       onPerspectiveChange(perspective) + onVariantChange(variant)
  │       (next-sanity wires onVariantChange to a server action that sets the cookie + refresh())
  └─ comlink loader/perspective {projectId, dataset, perspective, variant}
        → @sanity/core-loader enableLiveMode updates $perspective and $variant,
          re-posts loader/query-listen {…, perspective, variant} for each live query
        → Presentation refetches with client.fetch(query, params, {perspective, variant})
          and posts loader/query-change {…, perspective, variant, result}
        → core-loader caches by {perspective, variant, query, params} and updates the UI
```

## Changes per package

### A. `packages/preview-url-secret` (`@sanity/preview-url-secret`)

Mirror everything `urlSearchParamPreviewPerspective` / `studioPreviewPerspective` does today:

1. `src/constants.ts`:
   - `export const urlSearchParamPreviewVariant = 'sanity-preview-variant'` (next to `urlSearchParamPreviewPerspective = 'sanity-preview-perspective'`).
   - `export const variantCookieName = 'sanity-preview-variant'` (next to `perspectiveCookieName`).
2. `src/parsePreviewUrl.ts`: read `url.searchParams.get(urlSearchParamPreviewVariant)` into `studioPreviewVariant`; when a `redirectTo` URL is built and it doesn't already carry the param, forward it (same block that forwards `studioPreviewPerspective` onto `redirectUrl`). Return `studioPreviewVariant` in the parsed result.
3. `src/types.ts`: add `studioPreviewVariant` to `ParsedPreviewUrl` (`string | null`) and to `PreviewUrlValidateUrlResult` (`string | null | undefined`, only defined when `isValid`), mirroring how `studioPreviewPerspective` is declared on both.
4. `src/validatePreviewUrl.ts`: `const studioPreviewVariant = isValid ? parsedPreviewUrl.studioPreviewVariant : undefined` and include it in the returned object.
5. `src/withoutSecretSearchParams.ts`:
   - `withoutSecretSearchParams`: also `searchParams.delete(urlSearchParamPreviewVariant)`.
   - `setSecretSearchParams(url, secret, redirectTo, perspective)`: add an optional trailing parameter `variant?: string`; when provided, `searchParams.set(urlSearchParamPreviewVariant, variant)`, otherwise `searchParams.delete(urlSearchParamPreviewVariant)`. Keep it the last parameter so existing callers compile unchanged.
6. `src/definePreviewUrl.ts` (used by standalone/preview-kit style setups): wherever `studioPreviewPerspective` is written into the enable URL as `sanity-preview-perspective`, accept and write an optional `studioPreviewVariant` as `sanity-preview-variant` the same way.
7. `PreviewUrlResolverOptions` / resolver context types in `src/types.ts`: wherever `studioPreviewPerspective` appears as a context/options field (e.g. the resolver context used by the deprecated function-style `previewUrl` in Presentation), add an optional `studioPreviewVariant?: string` sibling.

### B. `packages/core-loader` (`@sanity/core-loader`)

All in `src/live-mode/enableLiveMode.ts` and `src/types.ts`:

1. Add a `$variant` atom next to `$perspective`: `const $variant = atom<string | undefined>(undefined)` (no client-config fallback — the client currently has no variant config; if the client team later adds one, initialize from `client.config()` the same way perspective does).
2. In the `comlink.on('loader/perspective', …)` handler: `const nextVariant = data.variant || undefined; $variant.set(nextVariant); onVariant?.(nextVariant)` next to the existing perspective handling, before `updateLiveQueries()`.
3. Cache keys: the cache is keyed with `JSON.stringify({perspective, query, params})` in three places (the `loader/query-change` handler, `hydrate`, and `updateLiveQueries`). Change all of them to `JSON.stringify({perspective, variant, query, params})`. Note `JSON.stringify` drops `undefined` values, so the no-variant key stays byte-identical to today's key — this is intentional and keeps old studio versions (that never send `variant` on `loader/query-change`) compatible.
4. `emitQueryListen()`: include `variant: $variant.get()` in the `loader/query-listen` post and `$fetch.setKey('variant', variant)` next to `$fetch.setKey('perspective', perspective)`.
5. `updateLiveQueries()`: read `const variant = $variant.get()`, use it in the cache key, include it in the `$fetch.set({…})` state and in the `loader/documents` post.
6. `src/types.ts`:
   - `QueryStoreState`: add `variant?: string`.
   - `EnableLiveModeOptions`: add `onVariant?: (variant: string | undefined) => void` with TSDoc mirroring `onPerspective` ("Fires when the variant changes in the Studio, allowing you to persist the change to a session cookie if needed").
7. Destructure `onVariant` from options in `enableLiveMode` next to `onPerspective`.

### C. `packages/react-loader` (`@sanity/react-loader`)

1. `src/createQueryStore/universal.ts` (and `server-only.ts` if it duplicates the logic): `loadQuery` accepts `options.variant?: string`; resolve as `const variant = options.variant || undefined` (no client-config fallback), pass it to the `client.fetch` call next to `perspective`, include it in the returned initial payload and in the cache key `JSON.stringify({query, params, perspective, …})` → add `variant`.
2. `src/types.ts`: add `variant?: string` to the fetch/`loadQuery` options type and to `QueryResponseInitial`.
3. `src/defineUseLiveMode.ts`: forward a new `onVariant` option into `enableLiveMode` (mirror `onPerspective`).
4. `src/defineUseQuery.ts`: if it reacts to snapshot `perspective` changes, mirror for `variant` (the `QueryStoreState.variant` key added in core-loader flows through automatically; verify nothing filters unknown keys).

### D. `packages/svelte-loader` (`@sanity/svelte-loader`)

Same as react-loader: `src/createQueryStore.ts` `loadQuery` accepts and forwards `options.variant`, includes it in the cache key and initial payload; `src/defineUseLiveMode.ts` forwards `onVariant` if it exposes `onPerspective`-style options (it currently calls `enableLiveMode` without exposing `onPerspective` — if so, just make sure nothing breaks and optionally expose `onVariant` alongside adding `onPerspective` passthrough only if trivial; do not redesign its public API here).

### E. `packages/visual-editing` (`@sanity/visual-editing`)

1. `src/types.ts` (`VisualEditingOptions`, around the existing `onPerspectiveChange` at ~line 596): add

   ```ts
   /**
    * Fires when the editing variant changes in the Studio, with the bare variant id,
    * or undefined when the variant is cleared. Allows persisting the change to a
    * session cookie so server-side fetches can apply it.
    */
   onVariantChange?: (variant: string | undefined) => void
   ```

2. `src/ui/usePerspectiveSync.tsx`: extend the existing hook (do not create a separate variant hook — perspective and variant arrive on the same messages):
   - New parameter `onVariantChange?: (variant: string | undefined) => void`.
   - `const handlesVariantChange = !!onVariantChange`; include `handlesVariantChange` in the `visual-editing/fetch-perspective` request payload next to `handlesPerspectiveChange`.
   - In `handlePerspective` (both the fetch response and the `presentation/perspective` listener): payload is now `{perspective, variant?}`; keep dispatching the whole message data and additionally call `onVariantChange?.(data.variant)`.
   - Add `handlesVariantChange` to the effect dependency array like `handlesPerspectiveChange`.
3. `src/ui/overlayStateReducer.ts`: state gains `variant: string | undefined`; the `presentation/perspective` case sets both `perspective` and `variant` from `message.data`.
4. `src/ui/Overlays.tsx`: accept and thread `onVariantChange` (prop type around line 188, destructure ~line 201, pass to `usePerspectiveSync(comlink, dispatch, onPerspectiveChange, onVariantChange)` ~line 254). Pass the reducer's `variant` down wherever `perspective` is passed to `useReportDocuments`.
5. `src/ui/VisualEditing.tsx`: destructure `onVariantChange` from options and forward to `Overlays` (mirror `onPerspectiveChange` at lines ~40 and ~114). Do the same in any framework wrapper components that explicitly enumerate props (`src/next-pages-router/`, `src/react-router/`, `src/remix/`, etc. — grep for `onPerspectiveChange` and mirror every occurrence).
6. `src/ui/useReportDocuments.ts`: accept `variant: string | undefined` next to `perspective`, include it in the `visual-editing/documents` post, and include it in the "did it change" comparison (`lastReported`) so a variant switch re-reports documents.
7. `src/ui/LoaderComlink.tsx` + `src/ui/loader-comlink/context.ts`:
   - context: add `export let comlinkVariant: string | null = null` and `setLoaderVariant(variant: string | null)` mirroring `comlinkPerspective` / `setLoaderPerspective` (notify listeners).
   - `LoaderComlink`: in the `loader/perspective` handler call `setLoaderVariant(data.variant ?? null)`; reset to `null` in the cleanup path alongside the perspective reset.
8. `src/react/usePresentationQuery.ts`: subscribe to `comlinkVariant` via `useSyncExternalStore` like `comlinkPerspective`; include `variant: variant ?? undefined` in the `loader/query-listen` post. Do **not** gate posting on variant being set (variant is optional; the existing `if (!projectId || !dataset || !perspective) return` guard stays as-is). Optionally expose `variant` on the returned state like `perspective` (from `loader/query-change` events).
9. `src/visual-editing-types` (`packages/visual-editing-types`): only if something there mirrors perspective at the node level — `SanityNode.perspective` is about studio intent links, **not** the preview data perspective. Leave it alone.

## Todo list

- [ ] preview-url-secret: add `urlSearchParamPreviewVariant` + `variantCookieName` constants
- [ ] preview-url-secret: parse/forward/return `studioPreviewVariant` in `parsePreviewUrl` + `validatePreviewUrl` + types
- [ ] preview-url-secret: handle the variant param in `withoutSecretSearchParams` / `setSecretSearchParams` / `definePreviewUrl` / resolver option types
- [ ] preview-url-secret: extend existing unit tests for parse/validate/without/set with variant cases
- [ ] core-loader: `$variant` atom, `loader/perspective` intake, `onVariant` option, `variant` in query-listen/documents posts, cache keys, `QueryStoreState.variant`
- [ ] core-loader: unit tests for the new cache-key + message behavior where test coverage exists
- [ ] react-loader: `loadQuery` `variant` option → fetch + initial payload + cache key; `useLiveMode` forwards `onVariant`
- [ ] svelte-loader: `loadQuery` `variant` option → fetch + initial payload + cache key
- [ ] visual-editing: `VisualEditingOptions.onVariantChange` + thread through `VisualEditing`/`Overlays`/framework wrappers
- [ ] visual-editing: `usePerspectiveSync` handles `variant` + `handlesVariantChange`; reducer state gains `variant`
- [ ] visual-editing: `LoaderComlink`/context `setLoaderVariant`; `usePresentationQuery` round-trips variant; `useReportDocuments` includes variant
- [ ] Bump `@sanity/presentation-comlink` to the release containing the variant fields (phase 1)
- [ ] Run `pnpm build`, `pnpm lint`, `pnpm test` at the repo root; fix fallout
- [ ] Changesets: minor bumps for `@sanity/preview-url-secret`, `@sanity/core-loader`, `@sanity/react-loader`, `@sanity/svelte-loader`, `@sanity/visual-editing`
- [ ] Open PR; after merge + release, unblock phases 3 (studio) and 4 (next-sanity)

## Additional knowledge for the agent

- **Backward compatibility is the hard requirement.** Old studios never send `variant`; old frontends never echo it. Everything must behave exactly as today when `variant` is absent. That's why the cache key uses `JSON.stringify({perspective, variant, query, params})` — `undefined` is dropped by `JSON.stringify`, so no-variant keys are identical to current keys on both sides of the wire.
- **`variant` is orthogonal to `perspective`.** It is a plain string id, never an array, never part of the perspective stack. Don't run it through `validateApiPerspective` or any perspective normalization. Sanitization: treat empty string as `undefined`.
- **Where the variant value comes from**: the studio Presentation tool (phase 3) reads `usePerspective().selectedVariantName` (bare id from the `variant` router sticky param) and emits it on the iframe URL + comlink. This repo only transports it.
- **`@sanity/client` variant support is being added by the client team** and is not part of this work. `loadQuery` passing `variant` to `client.fetch` requires that release; if the published client types don't yet include it when you implement, pass it through a single narrowly-typed helper with a cast and a `// TODO(variant): remove cast once @sanity/client ships the variant fetch option` comment, and bump the client dependency when available.
- The repo packages `packages/presentation`, `packages/next-loader`, and `packages/nuxt-loader` are migration stubs (moved to `sanity`, `next-sanity`, `@nuxtjs/sanity` respectively) — no changes there.
- Repo tooling: pnpm + turbo + changesets. Root scripts: `pnpm build` (packages only), `pnpm lint`, `pnpm test`, `pnpm format`.
- Reference implementations to mirror line-by-line: everything `perspective`-related in `packages/core-loader/src/live-mode/enableLiveMode.ts`, `packages/visual-editing/src/ui/usePerspectiveSync.tsx`, and `packages/preview-url-secret/src/parsePreviewUrl.ts`. When in doubt, do for `variant` exactly what the adjacent line does for `perspective`.
- The apps under `apps/` (next, page-builder-demo, studio) are useful for manual smoke tests (`pnpm dev:next`) but updating them is not required for this phase; the studio side that emits variants ships in phase 3.
