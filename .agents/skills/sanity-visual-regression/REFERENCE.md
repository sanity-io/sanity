# Visual Regression Reference

## Architecture and rationale

- **Why stories are co-located:** each package owns its CSF files and keeps component, fixture,
  test-harness, and test-only imports within the same workspace boundary. `dev/storybook` is only
  the shared host; its discovery globs target workspace package `src` roots without traversing
  dependency symlinks under nested `node_modules` directories.
- **Why browser tests are snapshotted in place instead of moved into Storybook:** the
  `*.browser.test.tsx` files use `vitest-browser-react`, custom server commands
  (`readFileAsBase64`), clipboard/PTE helpers and mid-test `page.viewport()` mutations — none of
  which map onto Storybook `play()` functions. They were also already migrated once (Playwright
  CT → vitest browser mode). `@chromatic-com/vitest` snapshots each test's end state with zero
  test changes, so each browser test defines its harness component inline (`FooHarness`) and
  gets no CSF re-export in Storybook. While the Vitest integration was in early access the
  harnesses lived in shared `*Story.tsx` files with thin stories on top; both were removed once
  it went GA, so today every `*Story.tsx` is a Storybook harness owned by a `*.stories.tsx`.
- **Why the storybook Vite config mirrors `vitest.browser.config.mts`:** the `monorepo` exports
  condition resolves `sanity` (and other workspace packages) to TypeScript source; the
  vanilla-extract plugin compiles `.css.ts`; the React Compiler babel preset matches what the
  studio ships. Divergence here would make snapshots render differently from production.
- **Why preview imports both `ui5/styles.css` and `@sanity/ui/styles.css`:** the studio entry
  side-effect-imports both. Storybook must too — colocated sentinel stories import source files
  directly and never hit the `sanity` package entry, so they would otherwise snapshot without
  the ui5 reset and design tokens.
- **One Chromatic project per integration type** (Chromatic constraint): `sanity` (Storybook),
  `sanity_e2e` (Playwright), plus a Vitest-type project for the browser tests (created when
  `CHROMATIC_PROJECT_TOKEN_VITEST` is added). The integrations never cross: the Storybook project
  only receives `storybook build` output, Playwright archives are uploaded from `e2e.yml` with
  `chromatic --playwright`, Vitest archives from `chromatic.yml` with `chromatic --vitest`.
  `dev/storybook` therefore has no `@chromatic-com/playwright` or `@chromatic-com/vitest`
  wiring and hosts no specs or browser tests — its `playwright` dependency is only the browser
  runner that `@storybook/addon-vitest` uses to render stories.

## Local Chromatic runs

```bash
# Storybook: publish + snapshot from your machine (token from the Chromatic project's Manage page)
CHROMATIC_PROJECT_TOKEN=<storybook-token> pnpm --filter sanity-storybook chromatic

# Vitest capture (plugin gated behind CHROMATIC=1; chromium is auto-selected):
CHROMATIC=1 pnpm --filter sanity test:browser
# Archives land in packages/sanity/.vitest/chromatic (gitignored). Upload them:
CHROMATIC_PROJECT_TOKEN=<vitest-token> pnpm --filter sanity exec chromatic --vitest

# Playwright e2e: archives are written during the normal e2e run, then uploaded:
CHROMATIC_PROJECT_TOKEN=<e2e-token> pnpm --filter e2e exec chromatic --playwright
```

CI flag semantics (all three uploads): `--only-changed` (TurboSnap), `--exit-zero-on-changes`
(non-gating burn-in), `--auto-accept-changes main`. Flip gating on later by removing
`exitZeroOnChanges` from `.github/workflows/chromatic.yml`.

## Vitest capture details

- The plugin is registered in `packages/sanity/vitest.browser.config.mts` only when
  `CHROMATIC=1`. Flag-off runs are byte-identical to a checkout without the integration.
- Capture is chromium-only (plugin requirement; Chromatic re-renders archives in its own
  standardized cloud browser). The config throws if `SANITY_VITEST_BROWSER` is set to another
  browser while `CHROMATIC=1`.
- One archive per test case that ran (skipped tests capture nothing). In the Chromatic build the
  component title is the test file path (`src/core/releases/tool/components/Table/__tests__/Table`)
  and the snapshot name is the `describe` / `it` chain plus `Snapshot #1`, so a test's title is
  its snapshot's name — keep `it(...)` titles descriptive.
- Once the integration is active, inside browser tests you can use (from `@chromatic-com/vitest`):
  - `configure({title, delay, disableAutoSnapshot, diffThreshold, ...})` — per test, suite, or
    file scope. `title` fixes ambiguous build-table names.
  - `await takeSnapshot('state name')` — targeted mid-test snapshots (e.g. menu open, mid-drag).
  - ⚠️ Both require the plugin to be registered for the running project. `takeSnapshot()` throws
    `TypeError` in a test that is not registered — do NOT add calls to shared test files until
    the integration is active and CI always runs the capture job.
- Cost control: end-of-test snapshots ≈ number of test cases. Reduce with per-suite
  `configure({disableAutoSnapshot: true})` (opt-out) or flip the model to opt-in by disabling at
  the plugin level and re-enabling per file.

### TurboSnap for the Vitest project

TurboSnap needs two halves: `chromaticPlugin({turboSnap: true})` in
`vitest.browser.config.mts`, which writes `.vitest/chromatic/preview-stats.json` (the Vite module
graph per test file, ~2 MB, paths relative to `packages/sanity`), and `chromatic --vitest
--only-changed` on upload. Keep them together: with `--only-changed` and no stats file the CLI
(18.7) fails the upload with "TurboSnap requires a stats file" instead of falling back to a full
build. The CLI defaults the base directory to the working directory, so running the upload from
`packages/sanity` (as `chromatic.yml` does) resolves the stats paths without `--storybook-base-dir`.
Chromatic only turns TurboSnap on after ten successful builds on the project; until then every
build is full.

What to expect, measured on the full chromium capture (34 test files, 118 snapshots):

- Every test that mounts `TestWrapper` (26 of 32 snapshotting files) depends on the whole `sanity`
  entry, so a change anywhere in `packages/sanity/src/core` — or to `packages/sanity/package.json`,
  which `src/core/version.ts` imports — re-snapshots ~98 of 118. `vitest.browser.config.mts` and
  `test/setup/browser.ts` are recorded as dependencies of every test file, so editing them is a
  full run. The Storybook project has the same shape (a dependency bump re-snapshots ~70 of its
  ~110 stories).
- Leaf components with their own test are cheap: `Table.tsx` traces to 2 snapshots,
  `CommentInput.tsx` to ~12.
- Files outside the graph (`structure/`, `presentation/`, the other packages except the seven the
  browser tests import, `e2e/`, `dev/`) trace to zero test files, so those PRs upload an empty
  build. Over the 60 PRs merged before this was written, about a third touched nothing in the
  graph and the simulated mean was ~31 snapshots per build instead of 118.
- Dependency bumps are traced through `pnpm-lock.yaml` to `node_modules/<pkg>` modules in the
  stats (pnpm lockfiles are supported), so a bump of a rendering dependency re-runs its consumers
  while a devDependency bump traces to nothing — unless the bump also touches
  `packages/sanity/package.json` (see above). If that noise matters, `--untraced
packages/sanity/package.json` is the documented escape hatch: dependency changes still arrive
  via the lockfile route, only the version string edge is dropped. Not enabled yet.
- Chromatic bails to a full build when a changed file cannot be linked to specific tests (the
  Storybook job bails on `dev/storybook/.storybook/preview.tsx` edits the same way); read the
  "TurboSnap disabled due to file change" lines in the job log before assuming tracing is broken.

## Playwright e2e snapshots

- Specs that take visual snapshots use `e2e/studio-visual-test.ts`, which composes the studio
  fixtures with the Chromatic archive fixture via `mergeTests` and exports
  `takeChromaticSnapshot(page, 'name', testInfo)` (chromium-only, one snapshot per state).
  ⚠️ Do NOT apply the Chromatic fixture suite-wide (e.g. in `studio-test.ts`): it instruments
  pages over CDP to archive resources, which broke the studio's streaming connections on every
  chromium shard when tried (firefox, having no CDP, was unaffected). Scope it to snapshot specs
  only.
- `disableAutoSnapshot: true` in `playwright.config.ts` keeps even those specs from snapshotting
  automatically at test end — snapshots happen only at explicit `takeChromaticSnapshot` calls.
- Specs that edit documents hang under the fixture for the same CDP reason
  (`createDraftDocument`'s editable-form wait times out), so e2e snapshots are for **page chrome
  and read-only states** — document form states are covered by the vitest browser tests (Vitest
  project) and the authored stories instead.
- Only snapshot deterministic states: chrome (navbar, panes) without live data, and never
  anything showing relative timestamps ("2 minutes ago"), presence from other CI runs, or
  dataset-dependent lists.
- The e2e studio (`dev/studio-e2e-testing`) must set a workspace `icon`. The default
  letter-mark hashes `projectId` + `dataset` into a color, and e2e datasets change per PR.
- Archives are written into the Playwright output dir during the run; the `e2e.yml` workflow
  merges shard artifacts and uploads once with `chromatic --playwright` using
  `CHROMATIC_PROJECT_TOKEN_E2E`.

## Storybook + addon-vitest

- `pnpm --filter sanity-storybook test` runs every story as a vitest browser-mode test (render +
  play) via portable stories. The project is intentionally NOT in the root `vitest.config.mts`
  multi-project list — same reason as `sanity-browser` (needs a real browser).
- Story files: CSF3 with `satisfies Meta<typeof Component>`; titles group by area
  (`Portable Text/…`, `UI Components/…`). Put each story in the owning package's `src` tree,
  normally in the same `__tests__` directory as its component or `*Story.tsx` harness, and use
  package-local relative imports. Do not deep-import implementation or test files from another
  workspace.
- Icons: import per-icon subpaths (`@sanity/icons/Add`), never the barrel. `@sanity/ui` v4:
  `ToastProvider` comes from `@sanity/ui/toast`; `Stack`/`Grid` use `gap`/`gridTemplateColumns`.
- Components that call `useTranslation` (directly or via `ui-components`) must render inside
  `TestWrapper` — the mock workspace registers the studio i18n instance with react-i18next; a
  bare story would suspend forever on the uninitialized global instance.

## Vercel deployment

`dev/storybook` deploys as Vercel project `studio-storybook` on the `sanity-sandbox` team
(production alias `studio-storybook.sanity.dev`, PR preview deploys via Git integration). Setup
steps live in [dev/storybook/README.md](../../../dev/storybook/README.md).

## Troubleshooting

- **Story renders blank in Chromatic but fine locally:** usually an unresolved suspense (mock
  workspace boot) — raise `parameters.chromatic.delay`.
- **Unexpected full rebuilds (TurboSnap not kicking in):** check `pnpm-lock.yaml` or preview
  file churn; `npx chromatic trace <changed files>` explains what got traced.
- **A story flakes between builds:** Chromatic's flake filter auto-ignores unstable regions, but
  prefer fixing the source (animation, focus ring, async boot) or `disableSnapshot` as a last
  resort.
- **Fork PRs:** all Chromatic jobs skip (secrets unavailable). Push the branch to the main repo
  to get snapshots.
