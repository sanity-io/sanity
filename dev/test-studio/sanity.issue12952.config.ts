// Reproduction config for sanity-io/sanity#12952.
//
// "Workspaces auth-divergence warning fires even when auth is shared by reference (CLI cloning)"
// https://github.com/sanity-io/sanity/issues/12952
//
// HOW TO USE
//
// From the repo root, after `pnpm install && pnpm build`:
//
//   cd dev/test-studio
//   pnpm exec sanity documents validate \
//     --workspace a \
//     --yes \
//     --config sanity.issue12952.config.ts
//
// EXPECTED on `main` (the bug):
//   [sanity] Workspaces for project "p-issue12952" declare different `auth`
//   configurations. ... Consolidate these to a single shared config:
//     • "a"
//     • "b"
//     • "c"
//
// EXPECTED after the fix: no warning. All three workspaces share a single
// `createAuthStore` reference, which the warning's own message recommends as
// the canonical workaround.
//
// WHY THIS FIRES
//
// The bug lives across two repos. The user's config (this file) shares one
// AuthStore reference across all workspaces — that's the right thing to do per
// the warning message. But when `sanity documents validate` (and other CLI
// commands that don't need a real session) loads this config via
// `@sanity/cli-core`'s `getStudioWorkspaces`:
//
//   const unauthedWorkspaces = rawWorkspaces.map((workspace) => ({
//     ...workspace,
//     auth: {state: of(getEmptyAuth())},
//   }))
//
// every workspace's `auth` is replaced with a freshly allocated stub. Each
// stub satisfies `isAuthStore` (it has `state.subscribe` via rxjs's `of`), so
// when `prepareConfig` (in `packages/sanity/src/core/config/prepareConfig.tsx`)
// fingerprints them, each one shows up as a distinct `AuthStore@<id>` —
// regardless of how the user set up auth upstream.
//
// The reporter's verification trace confirms this exactly: at `prepareConfig`
// entry the three workspaces' auth references are distinct objects with ids
// `AuthStore@1`, `AuthStore@2`, `AuthStore@3`, even though `sameAuth` was
// `true` in their user code.
//
// SEE ALSO
//   - Failing unit test reproducing the same condition without the CLI:
//     packages/sanity/src/core/config/__tests__/prepareConfig.test.ts
//     (describe block 'prepareConfig — issue #12952 (CLI auth substitution)')
//   - CLI source (separate repo):
//     https://github.com/sanity-io/cli/blob/main/packages/@sanity/cli-core/src/config/studio/getStudioWorkspaces.ts

import {createAuthStore, defineConfig} from 'sanity'

// Shared by reference across all three workspaces. The warning message
// recommends exactly this pattern ("consolidate to a single shared config").
const sharedAuthStore = createAuthStore({
  // Placeholder projectId — the warning fires at config-load time, before any
  // network call against the project actually runs.
  projectId: 'p-issue12952',
  dataset: 'production',
  loginMethod: 'dual',
})

const shared = {projectId: 'p-issue12952', auth: sharedAuthStore}

export default defineConfig([
  {...shared, name: 'a', dataset: 'production', basePath: '/a', title: 'A'},
  {...shared, name: 'b', dataset: 'development', basePath: '/b', title: 'B'},
  {...shared, name: 'c', dataset: 'production', basePath: '/c', title: 'C'},
])
