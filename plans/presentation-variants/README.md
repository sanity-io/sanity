# Editing variants in Presentation — master plan

This is the coordination document for adding **editing variant** support to the Presentation / Visual Editing / live preview stack. The work spans four repositories. Each repository has its own self-contained plan file (in this folder) that can be copy-pasted into that repository and handed to an agent as-is.

## Objective

The studio already supports editing variants: variant definitions can be created, documents can be attached to variants, and the selected variant lands in the studio's `PerspectiveProvider` (via the `variant` router sticky param → `usePerspective().selectedVariantName`).

`@sanity/client` is being updated (by another team, **not part of this work**) to accept a `variant` option in the same way it accepts `perspective` today, which it sends to the API as `?variant={variantId}`.

Once all phases are done: selecting a variant in the studio flows into Presentation, Presentation passes it to the preview iframe (URL param + comlink), the frontend persists it (cookie in next-sanity), refetches its queries with the `variant` parameter, and the preview updates — exactly mirroring how `perspective` behaves today.

## Status tracker

Mark each repo as done when its PR is merged and (where applicable) the package is released.

| Done | Phase | Repo                                                                    | Plan                                                       | Packages affected                                                                                                              |
| ---- | ----- | ----------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [ ]  | 1     | [sanity-io/comlink](https://github.com/sanity-io/comlink)               | [01-presentation-comlink.md](./01-presentation-comlink.md) | `@sanity/presentation-comlink`                                                                                                 |
| [ ]  | 2     | [sanity-io/visual-editing](https://github.com/sanity-io/visual-editing) | [02-visual-editing.md](./02-visual-editing.md)             | `@sanity/preview-url-secret`, `@sanity/core-loader`, `@sanity/react-loader`, `@sanity/svelte-loader`, `@sanity/visual-editing` |
| [ ]  | 3     | [sanity-io/sanity](https://github.com/sanity-io/sanity)                 | [03-sanity-presentation.md](./03-sanity-presentation.md)   | `sanity` (`packages/sanity/src/presentation`)                                                                                  |
| [ ]  | 4     | [sanity-io/next-sanity](https://github.com/sanity-io/next-sanity)       | [04-next-sanity.md](./04-next-sanity.md)                   | `next-sanity`                                                                                                                  |

## The shared contract

Every repo must follow this contract exactly; it is repeated in each plan file.

- **Wire value**: the bare variant id, e.g. `Ab12cd34` — NOT the full variant document id (`_.variants.Ab12cd34`). This is the same value the studio stores in the `variant` router sticky param. `undefined` means "no variant selected" (base content).
- **Client option**: `client.fetch(query, params, {perspective, variant})` → sent to the Content Lake API as `?variant={variantId}`. Client support is in progress by another team and is a prerequisite for fetches to actually apply the variant; all the plumbing in these plans is independent of it.
- **URL search param**: `sanity-preview-variant`, exported as `urlSearchParamPreviewVariant` from `@sanity/preview-url-secret/constants`. Only set when a variant is selected; never set to an empty string.
- **Cookie**: `sanity-preview-variant`, exported as `variantCookieName` from `@sanity/preview-url-secret/constants`. Same attributes as the existing `sanity-preview-perspective` cookie. Deleted (not set to empty) when the variant is cleared.
- **Comlink protocol** (`@sanity/presentation-comlink`): every message `data` that carries `perspective` gains an optional `variant?: string` sibling. The `visual-editing/fetch-perspective` request payload gains `handlesVariantChange?: boolean` next to `handlesPerspectiveChange`. All additions are optional → the protocol stays backward and forward compatible.
- **Callbacks**: `@sanity/visual-editing` gains `onVariantChange?: (variant: string | undefined) => void` mirroring `onPerspectiveChange`; `@sanity/core-loader` gains `onVariant?: (variant: string | undefined) => void` mirroring `onPerspective`.
- **Fetch option surface**: `sanityFetch` (next-sanity) and `loadQuery` (react/svelte loaders) accept an optional `variant?: string` with the same precedence as `perspective`: explicit option > cookie auto-resolve (next-sanity react-server condition, draft mode only) > `undefined`.

## The end-to-end flow (target state)

```
Studio URL sticky params: ?perspective=…&variant=Ab12cd34
  → PerspectiveProvider (usePerspective().selectedVariantName)
  → PresentationTool (sanity/presentation)
      ├─ iframe URL: ?sanity-preview-perspective=…&sanity-preview-variant=Ab12cd34
      │    → preview app draft-mode enable route (next-sanity defineEnableDraftMode)
      │    → validatePreviewUrl (@sanity/preview-url-secret) extracts studioPreviewVariant
      │    → cookies: sanity-preview-perspective + sanity-preview-variant
      ├─ comlink presentation/perspective {perspective, variant}
      │    → @sanity/visual-editing usePerspectiveSync
      │    → onVariantChange(variant) → next-sanity variantChangeAction → cookie + refresh()
      └─ comlink loader/perspective {projectId, dataset, perspective, variant}
           → @sanity/core-loader live mode ($variant atom)
           → loader/query-listen {perspective, variant, query, params}
           → Presentation refetches: client.fetch(query, params, {perspective, variant})
           → loader/query-change {perspective, variant, result} → view updates
  Server fetches (sanityFetch / loadQuery) read the cookie or explicit option
  → client.fetch(query, params, {perspective, variant}) → ?variant=Ab12cd34
```

Two delivery channels, exactly like perspective:

1. **Initial load / reload**: the variant travels in the iframe URL (`sanity-preview-variant`) and is persisted as a cookie by the draft-mode enable route, so server-side rendering fetches with the right variant.
2. **In-place change**: when the studio variant changes, Presentation posts comlink messages; frontends that handle them (new `@sanity/visual-editing` + next-sanity, or new loaders) refetch in place. Frontends that don't handle them get a full iframe reload with the new URL param (graceful degradation, same mechanism perspective uses via `handlesPerspectiveChange` / `handlesVariantChange`).

## Rollout phases

Phase order matters because of package dependencies. Phases 3 and 4 can run in parallel once phase 2 is released.

- **Phase 0 — prerequisite (not part of these plans)**: `@sanity/client` release that accepts `variant` in fetch options (in progress by the client team). Plumbing work in all phases can land before this ships; fetches simply start applying the variant once consumers bump the client.
- **Phase 1 — [sanity-io/comlink](https://github.com/sanity-io/comlink)**: add optional `variant` fields to the `@sanity/presentation-comlink` message types. Types-only, non-breaking. Release a minor version. Gates phases 2 and 3.
- **Phase 2 — [sanity-io/visual-editing](https://github.com/sanity-io/visual-editing)**: bump `@sanity/presentation-comlink`; add the `sanity-preview-variant` constants and parsing to `@sanity/preview-url-secret`; thread variant through `@sanity/core-loader`, `@sanity/react-loader`, `@sanity/svelte-loader`; add `onVariantChange` sync to `@sanity/visual-editing`. Release all touched packages. Gates phase 4 (and the preview-url-secret part gates phase 3).
- **Phase 3 — [sanity-io/sanity](https://github.com/sanity-io/sanity)**: bump `@sanity/presentation-comlink` + `@sanity/preview-url-secret` in `packages/sanity`; make Presentation read the selected variant and pass it via iframe URL + comlink; refetch loader queries with the variant.
- **Phase 4 — [sanity-io/next-sanity](https://github.com/sanity-io/next-sanity)**: bump `@sanity/visual-editing` + `@sanity/preview-url-secret`; store the variant cookie in the draft-mode enable route and the new `variantChangeAction`; resolve variant from cookies in `sanityFetch`.
- **Phase 5 — end-to-end validation**: see checklist below.

## End-to-end validation checklist (phase 5)

Using a studio with `beta.variants.enabled: true`, the Presentation tool, and a Next.js app on the updated `next-sanity`:

- [ ] Select a variant in the studio: the `variant` sticky param appears in the studio URL and Presentation posts `presentation/perspective` + `loader/perspective` including the variant (inspect with the comlink debug logs or browser devtools).
- [ ] The preview iframe URL / draft-mode enable URL contains `sanity-preview-variant=<id>`.
- [ ] The preview app sets the `sanity-preview-variant` cookie (devtools → Application → Cookies).
- [ ] Server-rendered content refetches with `?variant=<id>` (network tab on the API request) and the view updates to variant content.
- [ ] Loader-based queries (`useQuery` / `usePresentationQuery`) refetch and update in place when switching variants, without a full page reload (new visual-editing), or with a reload (old visual-editing — graceful degradation).
- [ ] Clearing the variant in the studio removes the cookie and the view returns to base content.
- [ ] Perspective switching still behaves exactly as before (no regressions).
