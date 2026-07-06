# Repro: Presentation tool writes `sanity.previewUrlSecret` to the wrong dataset

Tracking: Linear `SAPP-3833` / GitHub [sanity-io/sanity#12794](https://github.com/sanity-io/sanity/issues/12794)

## Reported bug

> In a multi-workspace Studio with different datasets per workspace, the Presentation
> tool's `create-preview-secret.ts` always writes `sanity.previewUrlSecret` documents to
> the **first workspace's dataset**, ignoring the active workspace's dataset configuration.
> This causes `defineEnableDraftMode` (from `next-sanity`) on the frontend to return 401,
> because the frontend queries the correct dataset where the secret doesn't exist.
>
> This works correctly with `sanity dev` locally — **only the hosted Studio is affected**
> (`*.sanity.studio`, proxied through `www.sanity.io/@org/studio/appId/...` with
> `_context={"mode":"core-ui"}`).

## Reproduction workspaces

Two workspaces were added to [`sanity.config.ts`](./sanity.config.ts) matching the report's
shape — same `projectId` (`ppsg7ml5`), different `dataset`, both with the Presentation tool:

| Workspace name                 | basePath                        | dataset   |
| ------------------------------ | ------------------------------- | --------- |
| `presentation-dataset-repro-a` | `/presentation-dataset-repro-a` | `test`    |
| `presentation-dataset-repro-b` | `/presentation-dataset-repro-b` | `test-us` |

Each also registers a second Presentation-tool instance named `presentation-repro`
(nav label **"Presentation (repro)"**) with an explicit `previewUrl.previewMode`. This
extra tool instance is required for the repro: `sharedSettings`' default Presentation tool
configures `previewUrl` as a bare string, and
[`resolve-preview-mode.ts`](../../packages/sanity/src/presentation/actors/resolve-preview-mode.ts)
short-circuits to `false` whenever `previewUrlOption` is a string/function/undefined —
skipping the entire `previewMode` state region (and therefore `create preview secret`)
in the [`previewUrlMachine`](../../packages/sanity/src/presentation/machines/preview-url.ts).
Use **"Presentation (repro)"**, not the plain "Presentation" tool, to exercise this code path.

## Local reproduction steps

1. `pnpm build && pnpm dev` (see root `AGENTS.md` for the `STUDIO_AUTH_TOKEN` hash-auth trick
   for headless/cloud environments).
2. Open `http://localhost:3333/presentation-dataset-repro-a/presentation-repro`, wait for the
   tool to load (the preview iframe doesn't need to succeed — the secret is created before
   the iframe navigates).
3. Query dataset `test` for the secret: `*[_type == "sanity.previewUrlSecret"]{_id, _createdAt, studioUrl}`
   (e.g. via the "Vision" tool scoped to that workspace, or the HTTP API). Confirm a fresh
   document exists with `studioUrl` pointing at `presentation-dataset-repro-a`.
4. Switch to workspace B (`http://localhost:3333/presentation-dataset-repro-b/presentation-repro`),
   via in-app navigation and/or a hard reload of the URL.
5. Query dataset `test-us` the same way and confirm its own fresh document, then re-query
   dataset `test` to confirm nothing new/changed leaked in from workspace B.

## What we found locally

Ran the steps above (see `preview_url_secret_dataset_isolation_evidence.log` captured
alongside this investigation):

- Opening workspace A's repro tool created a new `sanity.previewUrlSecret` document **in
  dataset `test`** with `studioUrl` correctly pointing at `presentation-dataset-repro-a`.
- Opening workspace B's repro tool created a new document **in dataset `test-us`** with
  `studioUrl` correctly pointing at `presentation-dataset-repro-b`.
- A hard reload of workspace B's tool created yet another fresh document, still correctly
  scoped to `test-us`, with dataset `test` left untouched.

**Locally, the bug does not reproduce** — this matches the original report, which explicitly
states `sanity dev` works correctly and the divergence only appears in the hosted Studio.

## Code-path analysis (is the report valid?)

Chain that's supposed to scope the mutation to the active workspace's dataset:

1. [`usePreviewUrlActorRef.ts`](../../packages/sanity/src/presentation/usePreviewUrlActorRef.ts)
   calls `useClient({apiVersion: API_VERSION})` and wires it into the `'create preview secret'`
   actor ([`create-preview-secret.ts`](../../packages/sanity/src/presentation/actors/create-preview-secret.ts)),
   which calls `createPreviewSecret(client, ...)` — the mutation that writes
   `sanity.previewUrlSecret`.
2. `useClient` ([`useClient.ts`](../../packages/sanity/src/core/hooks/useClient.ts)) resolves
   `useSource().getClient(options)`.
3. The `SourceProvider` feeding that hook comes from
   [`WorkspaceLoader.tsx`](../../packages/sanity/src/core/studio/workspaceLoader/WorkspaceLoader.tsx)
   (`workspace.unstable_sources[0]`), itself derived from `useActiveWorkspace()`, which
   re-resolves per matched `basePath`
   ([`ActiveWorkspaceMatcher.tsx`](../../packages/sanity/src/core/studio/activeWorkspaceMatcher/ActiveWorkspaceMatcher.tsx)).
4. Each source's `getClient` closure is built per-source in
   [`prepareConfig.tsx`](../../packages/sanity/src/core/config/prepareConfig.tsx) (`resolveSource`),
   from a `client` that comes out of that source's `AuthStore.state`.
5. **Leading in-repo suspect for the hosted-only divergence:** `getAuthStore`/`createAuthStore`
   ([`createAuthStore.ts`](../../packages/sanity/src/core/store/authStore/createAuthStore.ts))
   is memoized process-wide via lodash `memoize`, keyed by `canonicalHash(options)` (which
   includes `dataset`/`projectId`/`apiHost`/auth-config, but excludes two function fields).
   If, only in the hosted core-ui environment, some hashed field ends up equal across two
   differently-configured workspaces, they could collide onto the same memoized `AuthStore`
   (and thus the same `client`) — which would exactly reproduce "always writes to the first
   workspace's dataset, persists after reload" (the cache lives at module scope).
6. Every consumer of the hosted "core-ui" rendering context
   (`isCoreUiRenderingContext`/[`coreUiRenderingContext.ts`](../../packages/sanity/src/core/store/renderingContext/coreUiRenderingContext.ts))
   was checked — it's only read by capability gating and dashboard/canvas URL helpers
   (`ResourcesButton.tsx`, `useStudioUrl.ts`, canvas link hooks), **never** by
   workspace/auth/client resolution. The reporter's own theory ("core-ui interferes with
   client/dataset resolution") isn't directly substantiated by anything in this package.

**Assessment:** this is a valid, well-evidenced report (concrete repro steps + Network-tab
logs for both the broken hosted case and the working local case in the original issue). The
code that's supposed to scope the secret write to the active workspace's dataset looks
correct on inspection, and our local reproduction above confirms it behaves correctly here —
consistent with the reporter's own "local dev works" observation. We could not reproduce the
hosted-only divergence from this sandbox: it requires Sanity's hosted `*.sanity.studio` /
core-ui infrastructure (a real org + `sanity deploy` / `autoUpdates: true`), which isn't
available in this environment.

## Suggested next step to confirm the hosted-only divergence

Deploy this exact `dev/test-studio` config (or a minimal standalone studio using the same
`presentation-dataset-repro-a`/`b` shape) with `sanity deploy` / `autoUpdates: true` to a real
hosted `*.sanity.studio` URL, then repeat the steps above against
`https://<studio>.sanity.studio/presentation-dataset-repro-b/presentation-repro`, checking the
Network tab (or the same dataset queries) for which dataset the mutation actually lands in.
If it reproduces there, the `createAuthStore` memoization hypothesis above (or another
core-ui-specific interaction) is the next thing to instrument.
