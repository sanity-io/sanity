# Plan: add editing-variant fields to `@sanity/presentation-comlink`

- **Repo**: [sanity-io/comlink](https://github.com/sanity-io/comlink)
- **Package**: `packages/presentation-comlink` (`@sanity/presentation-comlink`)
- **Rollout phase**: 1 of 4 — this ships first; the Sanity monorepo (`sanity/presentation`) and `sanity-io/visual-editing` both depend on the released types.

## TLDR

Sanity Studio now supports **editing variants** (content variants a document can be attached to). The selected variant must flow from the studio through the Presentation tool into preview frontends, following the exact same paths `perspective` uses today. `@sanity/presentation-comlink` defines the postMessage protocol between the Presentation tool and preview iframes. This change adds an optional `variant?: string` field next to every existing `perspective` field in the message types, plus a `handlesVariantChange?: boolean` capability flag. Types-only, fully backward compatible, minor release.

## Why

- The studio stores the selected variant in the `variant` router sticky param and exposes it via its perspective provider. `@sanity/client` is being updated (separately, by the client team) to accept a `variant` fetch option that it sends to the API as `?variant={variantId}`.
- Presentation (studio side) and `@sanity/visual-editing` / loaders (iframe side) communicate through the message types defined in this package. Without `variant` in the protocol, the iframe can never learn which variant is selected, and Presentation can never refetch loader queries with it.
- The end goal across all repos: select a variant in the studio → Presentation passes it to the iframe (URL param + these comlink messages) → the frontend persists it (cookie) and refetches with `client.fetch(query, params, {perspective, variant})` → the preview updates.

## The end-to-end flow (where this package sits)

```
Studio (sanity/presentation)                         Preview iframe
────────────────────────────                         ──────────────
selected variant (bare id, e.g. "Ab12cd34")
  │
  ├─ posts presentation/perspective {perspective, variant}   → @sanity/visual-editing syncs it,
  │                                                            calls onVariantChange (next-sanity
  │                                                            stores it in a cookie + refreshes)
  ├─ responds to visual-editing/fetch-perspective             ← iframe asks on connect, reports
  │    with {perspective, variant}                              handlesPerspectiveChange /
  │                                                             handlesVariantChange capability
  ├─ posts loader/perspective {projectId, dataset,            → @sanity/core-loader updates its
  │    perspective, variant}                                    $variant atom, re-registers queries
  ├─ receives loader/query-listen {…, perspective, variant}   ← loaders declare what they need
  └─ posts loader/query-change {…, perspective, variant,      → loaders render the new results
       result} after fetching with {perspective, variant}
```

The **wire value** is always the bare variant id (`Ab12cd34`), never the full variant document id (`_.variants.Ab12cd34`). `undefined` means no variant selected (base content).

## Changes in this repo

All changes are in `packages/presentation-comlink/src/types.ts`. Add an optional `variant?: string` to the `data` (and where noted, `response`) of every message that carries `perspective`. Keep the field directly below `perspective` in each object for readability. Document each new field with a TSDoc comment: `The selected editing variant (bare variant id). Undefined when no variant is selected.`

### 1. `VisualEditingControllerMsg` → `presentation/perspective`

Current:

```ts
| {
    type: 'presentation/perspective'
    data: {
      perspective: ClientPerspective
    }
  }
```

New: add `variant?: string` to `data`.

### 2. `VisualEditingNodeMsg` → `visual-editing/fetch-perspective`

Current:

```ts
| {
    type: 'visual-editing/fetch-perspective'
    data:
      | undefined
      | {
          /**
           * Specifies if <VisualEditing> has a `onPerspecticeChange` prop, …
           */
          handlesPerspectiveChange: boolean
        }
    response: {
      perspective: ClientPerspective
    }
  }
```

New:

- add `handlesVariantChange?: boolean` to the request `data` object (optional — older `@sanity/visual-editing` versions won't send it, and Presentation treats absence as `false`). TSDoc: `Specifies if <VisualEditing> has an onVariantChange prop, which signals variant changes are handled and should not trigger a full page reload.`
- add `variant?: string` to the `response` object.

### 3. `VisualEditingNodeMsg` → `visual-editing/documents`

Add `variant?: string` to `data` (next to `perspective: ClientPerspective`).

### 4. `LoaderControllerMsg` → `loader/perspective`

Add `variant?: string` to `data` (`{projectId, dataset, perspective}`).

### 5. `LoaderControllerMsg` → `loader/query-change`

Add `variant?: string` to `data` (`{projectId, dataset, perspective, query, params, result, resultSourceMap?, tags?}`).

### 6. `LoaderNodeMsg` → `loader/query-listen`

Add `variant?: string` to `data` (`{projectId, dataset, perspective, query, params, heartbeat?}`).

### 7. `LoaderNodeMsg` → `loader/documents`

Add `variant?: string` to `data` (`{projectId, dataset, perspective, documents}`).

### 8. `PreviewKitNodeMsg` → `preview-kit/documents`

Add `variant?: string` to `data` for protocol completeness (`@sanity/preview-kit` is legacy and will likely never send it; the field just keeps the shape symmetrical).

## Todo list

- [ ] Add `variant?: string` to `presentation/perspective` data in `packages/presentation-comlink/src/types.ts`
- [ ] Add `handlesVariantChange?: boolean` to `visual-editing/fetch-perspective` request data and `variant?: string` to its response
- [ ] Add `variant?: string` to `visual-editing/documents` data
- [ ] Add `variant?: string` to `loader/perspective` data
- [ ] Add `variant?: string` to `loader/query-change` data
- [ ] Add `variant?: string` to `loader/query-listen` data
- [ ] Add `variant?: string` to `loader/documents` data
- [ ] Add `variant?: string` to `preview-kit/documents` data
- [ ] TSDoc every new field (bare variant id semantics, `undefined` = no variant)
- [ ] Run `pnpm build`, `pnpm type-check`, `pnpm lint`, `pnpm test` at the repo root
- [ ] Add a changeset (minor bump for `@sanity/presentation-comlink`) describing the new optional protocol fields
- [ ] Open a PR; after merge, release so downstream repos (sanity monorepo, visual-editing) can bump

## Additional knowledge for the agent

- **Backward/forward compatibility is the hard requirement.** These messages cross a postMessage boundary between independently-released packages (studio plugin vs. frontend libraries), so every new field MUST be optional. Old senders won't include `variant`; old receivers must be able to ignore it. Making any of these required is a breaking protocol change — do not do it.
- The message payloads are not runtime-validated in this package — it is types-only (`types.ts`), so no serialization/validation code needs to change. `comlinkCompatibility.ts` (compatibility actors) needs no changes.
- Naming: the field is `variant`, not `variantId`, to mirror the client fetch option (`client.fetch(query, params, {perspective, variant})`) that the client team is adding.
- There is an existing typo in the `handlesPerspectiveChange` TSDoc ("onPerspecticeChange"); feel free to fix it in passing, but do not rename the field.
- Repo tooling: pnpm + turbo. Root scripts: `pnpm build`, `pnpm type-check`, `pnpm lint` (oxlint), `pnpm test`, releases via changesets (`pnpm release`).
- Downstream consumers that will use these fields (context, not in scope here):
  - `sanity` monorepo `packages/sanity/src/presentation`: posts `presentation/perspective` and `loader/perspective`, answers `visual-editing/fetch-perspective`, consumes `loader/query-listen`, posts `loader/query-change`.
  - `@sanity/visual-editing`: consumes `presentation/perspective`, sends `visual-editing/fetch-perspective` and `visual-editing/documents`.
  - `@sanity/core-loader`: consumes `loader/perspective` and `loader/query-change`, sends `loader/query-listen` and `loader/documents`.
