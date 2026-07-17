# Plan: persist and apply editing variants in next-sanity

- **Repo**: [sanity-io/next-sanity](https://github.com/sanity-io/next-sanity)
- **Package**: `packages/next-sanity` (`next-sanity`)
- **Rollout phase**: 4 of 4. Depends on the phase-2 releases from [sanity-io/visual-editing](https://github.com/sanity-io/visual-editing): `@sanity/visual-editing` (new `onVariantChange` option) and `@sanity/preview-url-secret` (new `variantCookieName` constant + `studioPreviewVariant` in `validatePreviewUrl`). Also assumes phase 1 (`@sanity/presentation-comlink` variant message fields) and phase 3 (the studio Presentation tool emitting the variant).

## TLDR

Sanity Studio now supports **editing variants** (content variants a document can be attached to). The Presentation tool passes the selected variant to the preview app the same two ways it passes `perspective`: the draft-mode enable URL (`sanity-preview-variant` search param) and comlink messages relayed by `@sanity/visual-editing` (`onVariantChange`). next-sanity must persist the variant in a cookie (`sanity-preview-variant`, mirroring the `sanity-preview-perspective` cookie), resolve it in `sanityFetch`, and pass it to `client.fetch` so server-rendered content refetches with `?variant={variantId}` and the preview updates.

## Why

- The user-facing objective across all repos: select a variant in the studio → Presentation passes it down to the iframe → the frontend refetches its documents with the variant → the preview view updates.
- next-sanity is where the **cookie storage** lives for perspective today (`sanity-preview-perspective`, written by `defineEnableDraftMode` on initial load and by `perspectiveChangeAction` on in-place changes). The variant must be stored the same way so RSC fetches on subsequent requests apply it.
- `@sanity/client` is being updated (separately, by the client team — **not part of this work**) to accept a `variant` option in fetch, exactly like `perspective`, sent to the API as `?variant={variantId}`.

## The shared contract (must match the other repos exactly)

- **Wire value**: the bare variant id, e.g. `Ab12cd34` — never the full variant document id (`_.variants.Ab12cd34`). `undefined` = no variant selected (base content).
- **URL search param**: `sanity-preview-variant` (`urlSearchParamPreviewVariant` from `@sanity/preview-url-secret/constants`), set by the studio on the draft-mode enable URL. `validatePreviewUrl` (phase 2) extracts it as `studioPreviewVariant`.
- **Cookie**: `sanity-preview-variant` (`variantCookieName` from `@sanity/preview-url-secret/constants`), same attributes as the perspective cookie. Deleted — not set to an empty value — when the variant is cleared.
- **Callback**: `@sanity/visual-editing` (phase 2) calls `onVariantChange(variant: string | undefined)` when the studio posts `presentation/perspective {perspective, variant}`, and reports `handlesVariantChange: true` back to the studio when the prop is wired — which prevents full iframe reloads on variant switches.
- **Fetch option**: `sanityFetch({query, params, perspective, variant, …})` with the same precedence as perspective: explicit option > cookie auto-resolve (react-server condition, draft mode + serverToken only) > `undefined`.

## The end-to-end flow (where this repo sits)

```
Studio Presentation tool
  │
  ├─(1) Initial load: GET /api/draft-mode/enable
  │       ?sanity-preview-secret=…&sanity-preview-perspective=…&sanity-preview-variant=Ab12cd34
  │       → defineEnableDraftMode → validatePreviewUrl → {studioPreviewPerspective, studioPreviewVariant}
  │       → cookies: sanity-preview-perspective + sanity-preview-variant → redirect
  │
  ├─(2) In-place change: comlink presentation/perspective {perspective, variant}
  │       → @sanity/visual-editing → <VisualEditing> onVariantChange
  │       → variantChangeAction (server action): set/delete cookie + refresh()
  │
  └─(3) Server fetch: sanityFetch({query, params})
          → resolve perspective + variant from cookies (draft mode)
          → client.fetch(query, params, {perspective, variant, …}) → ?variant=Ab12cd34
          → RSC re-renders with variant content
```

`<SanityLive>` is not involved — it doesn't handle perspective today and won't handle variant either.

## Changes in this repo

All paths relative to `packages/next-sanity/`.

### 1. `src/draft-mode/define-enable-draft-mode.ts`

- Destructure `studioPreviewVariant` from the `validatePreviewUrl(client, request.url)` result (available after bumping `@sanity/preview-url-secret`).
- After the existing perspective-cookie block:

  ```ts
  if (studioPreviewVariant) {
    cookieStore.set({
      name: variantCookieName,
      value: studioPreviewVariant,
      httpOnly: true,
      path: '/',
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
    })
  } else {
    cookieStore.delete(variantCookieName)
  }
  ```

- The `else → delete` branch is deliberate and differs from perspective: perspective always has a value on the enable URL, but variant is optional, so entering preview without a variant must clear any stale variant cookie from a previous session.

### 2. `src/visual-editing/server-actions/index.ts` (`'use server'`)

Add `variantChangeAction` next to `perspectiveChangeAction`, following its structure (same `@internal` caveat comment, same dev-only skip when unchanged):

```ts
/**
 * @internal CAUTION: this is an internal action and does not follow semver. Using it directly is at your own risk.
 */
export async function variantChangeAction(variant: string | undefined): Promise<void> {
  const sanitizedVariant = sanitizeVariant(variant)
  const jar = await cookies()
  const current = jar.get(variantCookieName)?.value

  if (!sanitizedVariant) {
    if (!current) return
    jar.delete(variantCookieName)
    refresh()
    return
  }

  if (sanitizedVariant === current && process.env.NODE_ENV !== 'production') {
    // oxlint-disable-next-line no-console
    console.debug('variantChangeAction', 'Variant is the same, skipping', sanitizedVariant)
    return
  }

  jar.set(variantCookieName, sanitizedVariant, {
    httpOnly: true,
    path: '/',
    secure: true,
    sameSite: 'none',
  })
  refresh()
}
```

Unlike `perspectiveChangeAction`, an empty/undefined value is not an error — it means "variant cleared".

### 3. `src/visual-editing/VisualEditing.tsx` (RSC wrapper) and `src/visual-editing/client-component/VisualEditing.tsx`

- RSC wrapper: `onVariantChange={variantChangeAction}` next to the existing `onPerspectiveChange={perspectiveChangeAction}`.
- Client component: accept and forward the `onVariantChange` prop to the underlying `@sanity/visual-editing` component, exactly like `onPerspectiveChange` is forwarded today (grep both files for `onPerspectiveChange` and mirror every occurrence).
- Requires the bumped `@sanity/visual-editing` with the `onVariantChange` option (phase 2).

### 4. `src/live/shared/` helpers

- New `sanitizeVariant.ts`: `sanitizeVariant(variant: unknown): string | undefined` — returns the trimmed string when it matches `/^[A-Za-z0-9._-]+$/` (the bare-variant-id charset; single value, never comma-separated, never an array), otherwise `undefined`. No perspective-style fallback parameter.
- New `resolveVariantFromCookies.ts`, mirroring `resolvePerspectiveFromCookies.ts`:

  ```ts
  export async function resolveVariantFromCookies(options: {
    cookies: ReadonlyRequestCookies
  }): Promise<string | undefined> {
    const {cookies: jar} = options
    return jar.has(variantCookieName)
      ? sanitizeVariant(jar.get(variantCookieName)?.value)
      : undefined
  }
  ```

  Note the different default from perspective: perspective falls back to `'drafts'`, variant falls back to `undefined` (no variant).

- `src/live/shared/types.ts`: add `variant?: string` to the `sanityFetch` options type with TSDoc mirroring the `perspective` option docs (cookie name `sanity-preview-variant`, resolution rules below). Add it to the strict fetch type as **optional** (see strict-mode note).

### 5. `src/live/conditions/react-server/defineLive.tsx` (legacy / non-Cache-Components condition)

- `sanityFetch` signature gains `variant: _variant`.
- Resolution, mirroring perspective exactly:

  ```ts
  const variant = strict
    ? _variant
    : (_variant ?? (serverToken ? await resolveCookieVariant() : undefined))
  ```

  with a private helper next to `resolveCookiePerspective()`:

  ```ts
  async function resolveCookieVariant(): Promise<string | undefined> {
    return (await draftMode()).isEnabled
      ? await resolveVariantFromCookies({cookies: await cookies()})
      : undefined
  }
  ```

- Pass `variant` into the `client.fetch(…)` options next to `perspective`.
- Leave the `useCdn` and `token` derivations unchanged — they are keyed off `perspective`/`stega` only. (Variant content is only reachable in draft mode where `useCdn` is already false via non-published perspectives; if the client team later specifies CDN semantics for `variant`, that's a client-side concern.)
- Re-export `resolveVariantFromCookies` from `src/live/conditions/react-server/index.ts` next to `resolvePerspectiveFromCookies`.

### 6. `src/live/conditions/next-js/defineLive.tsx` (Cache Components condition)

- `sanityFetch` accepts `variant` and passes it straight to `client.fetch` — no `draftMode()`/`cookies()` calls inside (same constraint as perspective: dynamic APIs cannot be used inside `'use cache'`).
- Update the option docs/examples to show the recommended pattern: resolve outside the cached scope and drill as a prop, e.g. `const variant = isDraftMode ? await resolveVariantFromCookies({cookies: await cookies()}) : undefined`.
- Re-export `resolveVariantFromCookies` from `src/live/conditions/next-js/index.ts`.
- `src/live/conditions/default/index.ts` (client stub): add a throwing `resolveVariantFromCookies` stub mirroring the perspective one.

### 7. Strict mode (`src/live/shared/strictValidation.ts`)

No change to the validation itself: `strict: true` keeps requiring an explicit `perspective`, and `variant` stays optional — absence of a variant is a valid state, so there is nothing to force. The `strict` behavior for variant is simply "no cookie auto-resolution; only the explicit option is used" (covered by the `strict ? _variant : …` line). Document this in the option TSDoc.

### 8. Exports and dependency bumps

- Export `variantChangeAction` from `next-sanity/visual-editing/server-actions` next to `perspectiveChangeAction`; export `resolveVariantFromCookies` wherever `resolvePerspectiveFromCookies` is exported. Update `src/__tests__/exports.spec.ts` accordingly.
- `package.json`: bump `@sanity/visual-editing` and `@sanity/preview-url-secret` to the phase-2 releases.
- **Temporary fallbacks if implementing before those releases** (keep CI green, forward-compatible): define `const variantCookieName = 'sanity-preview-variant'` locally with `// TODO(variant): import from @sanity/preview-url-secret/constants once released`; read `studioPreviewVariant` via `new URL(request.url).searchParams.get('sanity-preview-variant')` after `isValid` (safe: the secret is already validated, same trust level as the perspective param); pass `onVariantChange` / the client `variant` fetch option through narrowly-typed casts with the same TODO tag.

### 9. Tests

- `test/sanityFetch.test.ts`: extend the perspective matrix with variant cases — explicit `variant` wins over cookie; cookie resolved only when draft mode + serverToken; no cookie → `undefined`; `strict: true` ignores the cookie; variant forwarded to the fetch query string.
- `test/setupMocks.ts`: make the MSW handler echo the `variant` query param like it echoes `perspective`.
- Add unit tests for `sanitizeVariant` (valid id, empty string, garbage, array) and `resolveVariantFromCookies` (cookie present/absent/invalid).
- Optional but recommended: update `apps/mvp` to demonstrate variant resolution (mirroring its `DraftModePerspectiveProvider`/cookie-resolve pattern) for manual verification.

## Todo list

- [ ] Bump `@sanity/visual-editing` + `@sanity/preview-url-secret` (or add TODO-tagged temporary fallbacks)
- [ ] `defineEnableDraftMode`: set/delete the `sanity-preview-variant` cookie from `studioPreviewVariant`
- [ ] `variantChangeAction` server action (set/delete cookie + `refresh()`)
- [ ] Wire `onVariantChange={variantChangeAction}` through the RSC wrapper and client `<VisualEditing>` component
- [ ] `sanitizeVariant` + `resolveVariantFromCookies` helpers in `src/live/shared/`
- [ ] `variant` option on `sanityFetch` in the `react-server` condition with cookie auto-resolve, passed to `client.fetch`
- [ ] `variant` option on `sanityFetch` in the `next-js` (Cache Components) condition, explicit-only, docs show the drill-as-prop pattern
- [ ] Export `variantChangeAction` + `resolveVariantFromCookies`; update `exports.spec.ts`
- [ ] Extend `sanityFetch.test.ts` matrix + MSW mocks; unit-test the new helpers
- [ ] `pnpm build`, `pnpm lint`, `pnpm test` green at the repo root
- [ ] Changeset (minor bump for `next-sanity`); open PR

## Additional knowledge for the agent

- **Ownership map**: cookie names and URL params are owned by `@sanity/preview-url-secret`; the comlink protocol by `@sanity/presentation-comlink`; the in-iframe sync by `@sanity/visual-editing`; the studio emitter by `sanity/presentation`. next-sanity owns the Next.js glue: enable route, server actions, cookie resolution, `sanityFetch`. `@sanity/next-loader` is NOT a dependency (it was inlined into next-sanity; only legacy `next-loader.*` request-tag strings remain).
- **The `#live/…` import alias** used inside the package (e.g. `#live/sanitizePerspective` in the server actions file) maps to `src/live/shared/*` via the package.json `imports` field — follow the same convention for the new helpers.
- **Variant is orthogonal to perspective**: a plain string id, never an array, never comma-joined, not a `ClientPerspective`. Don't touch `sanitizePerspective`, `LivePerspective`, or perspective resolution.
- **Deletion semantics matter**: perspective always has a value, variant doesn't. Anywhere the perspective code "sets", the variant code must "set or delete". A stale variant cookie silently changes what visitors in draft mode see, so both write paths (enable route and server action) clear it when no variant is active.
- **Two `defineLive` implementations** are selected via package export conditions (`react-server` vs `next-js` vs throwing `default`); both must gain the option, but only `react-server` auto-resolves cookies. Keep them consistent with how they diverge for `perspective` today.
- Repo tooling: pnpm + turbo + changesets; root scripts `pnpm build`, `pnpm lint` (oxlint), `pnpm test` (vitest, incl. browser tests), `pnpm format`.
- Reference implementations to mirror line-by-line: `perspectiveChangeAction`, `resolvePerspectiveFromCookies`, the perspective blocks in both `defineLive.tsx` files, and the perspective cookie block in `define-enable-draft-mode.ts`. When in doubt, do for `variant` exactly what the adjacent line does for `perspective`, minus the `'drafts'` fallback and plus the delete-when-cleared behavior.
