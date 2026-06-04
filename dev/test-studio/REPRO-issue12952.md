# Reproduction — issue #12952

> "Workspaces auth-divergence warning fires even when auth is shared by reference (CLI cloning)"
> https://github.com/sanity-io/sanity/issues/12952

## Summary

Under `sanity documents validate` (and other non-runtime CLI commands that go
through `@sanity/cli-core`'s `getStudioWorkspaces`), the
`warnOnDivergentProjectAuth` warning fires for any multi-workspace config,
even when the user shared a single `createAuthStore` reference across all
workspaces — which the warning message itself recommends as the canonical
workaround.

The root cause spans two repos. The fix needs design judgment about whether to
land in `@sanity/cli-core` (don't substitute, or substitute once) or in
`packages/sanity`'s `prepareConfig` (recognise the substituted shape and
suppress, or move the warning past auth resolution).

## What's on this branch

Two artifacts demonstrate the bug:

### 1. Failing unit test (no CLI, no install needed beyond `pnpm build`)

`packages/sanity/src/core/config/__tests__/prepareConfig.test.ts` —
the new `describe('prepareConfig — issue #12952 (CLI auth substitution)', ...)`
block has two tests:

- **Passes today (positive contract):**
  `'does not warn when workspaces share a single AuthStore reference (the canonical workaround)'`
  Confirms `prepareConfig` honours identity-equal `AuthStore` references when
  it sees them directly. This is the contract the CLI breaks upstream.

- **Fails today (the bug):**
  `'does not warn when the CLI substitutes auth on workspaces that originally shared a reference (#12952)'`
  Constructs the user's shared-reference setup, runs it through a `.map()` that
  mirrors `@sanity/cli-core`'s `getStudioWorkspaces.ts` (replaces each
  workspace's `auth` with `{state: of(/* empty auth */)}`), then calls
  `prepareConfig` and asserts no `project-auth-divergence` warning is
  collected. On `main` the assertion fails with three distinct fingerprint
  groups `[['a'], ['b'], ['c']]` — exactly matching the reporter's
  `AuthStore@1`/`AuthStore@2`/`AuthStore@3` trace.

Run:

```bash
pnpm install
pnpm build
pnpm --filter sanity exec vitest run \
  src/core/config/__tests__/prepareConfig.test.ts \
  -t "issue #12952"
```

Expected output on `main`:

```
✓ does not warn when workspaces share a single AuthStore reference (the canonical workaround)
× does not warn when the CLI substitutes auth on workspaces that originally shared a reference (#12952)

  AssertionError: expected { … } to be undefined
  + Received:
    {
      "groups": [["a"], ["b"], ["c"]],
      "message": "Workspaces for project \"issue12952-…\" declare different `auth` configurations. …",
      "projectId": "issue12952-…",
      "type": "project-auth-divergence",
    }
```

### 2. End-to-end repro config (run with a real CLI)

`dev/test-studio/sanity.issue12952.config.ts` — the reporter's three-workspace
config, lightly adapted, with one shared `createAuthStore` reference. Use this
to confirm the warning also fires through the real CLI loader (i.e. that the
unit-test trigger condition isn't an artifact of test setup):

```bash
cd dev/test-studio
pnpm exec sanity documents validate \
  --workspace a \
  --yes \
  --config sanity.issue12952.config.ts
```

Expected on `main`:

```
[sanity] Workspaces for project "p-issue12952" declare different `auth`
configurations. ... Consolidate these to a single shared config:
  • "a"
  • "b"
  • "c"
```

(The validate command itself will then error out talking to localhost — that's
the placeholder client, not the bug. The warning prints before that.)

## Verification trace from the reporter

| Check point                   | Same-ref test                                                       |
| ----------------------------- | ------------------------------------------------------------------- |
| At user-code `export default` | `sameAuth01=true, sameAuth02=true`                                  |
| At `prepareConfig` entry      | `0===1: false, 0===2: false`                                        |
| At `fingerprintAuth` call     | `AuthStore@1`, `AuthStore@2`, `AuthStore@3` (3 distinct object IDs) |

So the cloning happens between `export default` and `prepareConfig`, which
matches `getStudioWorkspaces.ts`'s `.map()`.

## Why the fix isn't on this branch

The bug exists in the seam between two repos:

- `@sanity/cli-core` allocates the per-workspace stub:
  `packages/@sanity/cli-core/src/config/studio/getStudioWorkspaces.ts`
  (`sanity-io/cli`).
- `packages/sanity`'s `prepareConfig` fingerprints whatever it receives and
  has no way to know the references were equal upstream.

Options the maintainer mentioned at triage time:

1. Move `warnOnDivergentProjectAuth` past per-workspace auth resolution so it
   sees the resolved stores (and dedupe by reference).
2. Detect the CLI stub shape in `prepareConfig` and suppress.
3. CLI-side: substitute auth once (shared) instead of per-workspace, or expose
   an opt-out that this command path can flip.

Leaving the choice to the maintainer. This branch is verification only.
