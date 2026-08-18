# sanity-storybook

Storybook for visual regression testing of the Sanity Studio monorepo, snapshotted by
[Chromatic](https://www.chromatic.com) on every PR and deployed to Vercel.

Its primary purpose is guarding the two styling migrations — styled-components →
vanilla-extract, and `@sanity/ui` → `ui5` — with automated visual diffs. See the
[`sanity-visual-regression` skill](../../.agents/skills/sanity-visual-regression/SKILL.md) for
the full workflow, including how to add coverage.

## Commands

```bash
# from the repo root
pnpm dev:storybook       # storybook dev server at http://localhost:6006
pnpm build:storybook     # static build via turbo (output: dev/storybook/storybook-static)

# from dev/storybook
pnpm test                # run every story as a vitest browser-mode test (@storybook/addon-vitest)
pnpm chromatic           # publish + snapshot manually (needs CHROMATIC_PROJECT_TOKEN in the env)
```

## How the stories work

- **Stories are package-owned and co-located.** Storybook discovers `*.stories.tsx` files in
  workspace package `src` trees; `dev/storybook` owns only the Storybook, Chromatic, and
  addon-vitest infrastructure. Keep a story in the same `__tests__` directory as the component or
  harness it covers and use package-local imports instead of reaching across workspace boundaries.
- **Harness reuse:** thin CSF files sit beside the `*Story.tsx` harness components that the vitest
  browser-mode tests already use (`TestWrapper` + `TestForm` with a mock client/workspace —
  deterministic, no network). The harnesses stay shared: tests exercise interactions, Chromatic
  snapshots the rendered states.
- **Authored migration sentinels:** component-local stories cover states the tests don't capture —
  `ui-components` wrapper variants (the `@sanity/ui` → `ui5` surface, with card/tone coverage
  prioritized) and vanilla-extract-migrated components.

The Vite config in [.storybook/main.ts](.storybook/main.ts) mirrors
`packages/sanity/vitest.browser.config.mts`: the `monorepo` exports condition resolves workspace
packages to TypeScript source, plus the vanilla-extract plugin and the React Compiler transform,
so stories render exactly like the studio and the browser tests.

## Chromatic

The [Chromatic workflow](../../.github/workflows/chromatic.yml) publishes this Storybook to the
`sanity` Chromatic project on every PR (secret: `CHROMATIC_PROJECT_TOKEN_STORYBOOK`), using
TurboSnap so only stories affected by the change are snapshotted. The check is non-gating during
burn-in (`exitZeroOnChanges`); merges to `main` auto-accept new baselines.

## Vercel deployment

The Storybook deploys to the `sanity-sandbox` Vercel team as project `studio-storybook`
(production: `https://studio-storybook.sanity.dev`, plus automatic preview deploys per PR via the
Git integration). One-time project setup, run by a maintainer from the **repo root** (`vercel` is
a root devDependency):

```bash
# 1. Authenticate (once)
pnpm vercel login

# 2. Create the project + set the Root Directory + first preview deploy (interactive):
#    - Set up and deploy? yes
#    - Scope: sanity-sandbox
#    - Project name: studio-storybook
#    - "Code directory?" -> ./dev/storybook
#    - Vercel misdetects the framework as Vite; that doesn't matter, because
#      vercel.json pins buildCommand/outputDirectory and overrides it.
#    - Connect the detected Git repository when prompted (origin).
#    - The monorepo exceeds Vercel's 15k-file upload limit, hence --archive=tgz.
pnpm vercel --scope sanity-sandbox --archive=tgz

# 3. Verify a production deploy
pnpm vercel --prod --scope sanity-sandbox --archive=tgz

# 4. Point the production domain at the project
pnpm vercel domains add studio-storybook.sanity.dev studio-storybook --scope sanity-sandbox
```

Notes:

- The first-deploy prompt is what persists the Root Directory (`dev/storybook`) on the project,
  and connecting the Git repository during setup enables automatic PR previews + production
  deploys on `main` (no separate `vercel git connect` needed if done during setup).
- [vercel.json](vercel.json) pins the build: `cd ../.. && pnpm exec turbo run build
--filter=sanity-storybook` with output `storybook-static`, so upstream workspace packages are
  built first and the project's detected framework preset is irrelevant. Git-integration builds
  clone the monorepo and install the pnpm workspace from the root (so `workspace:*` and
  `catalog:` protocols resolve) — the same behavior as the `test-studio-preview-iframe` project.
- Until this package lands on `main`, production deploys triggered by pushes to `main` fail with
  a missing-root-directory error — expected noise that stops once the PR merges.
- `.vercel/` link metadata is gitignored, same as the other dev apps.
- Optional (dashboard-only setting): set the project's Ignored Build Step to
  `npx turbo-ignore sanity-storybook` so commits that can't affect the Storybook skip deploys.
- Chromatic also permalinks every published Storybook build, so the Vercel deploy is for the
  stable URL + PR previews.
