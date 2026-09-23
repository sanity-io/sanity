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
- **One Chromatic project per integration type** (Chromatic constraint): "sanity studio"
  (Storybook), "sanity studio playwright" (e2e archives) and "sanity studio vitest" (browser
  tests). The integrations never cross: the Storybook project only receives `storybook build`
  output, Playwright archives are uploaded from `e2e.yml` through `chromaui/action` with
  `playwright: true`, Vitest archives from `chromatic.yml` through the same action with
  `vitest: true`. `dev/storybook`
  therefore has no `@chromatic-com/playwright` or `@chromatic-com/vitest` wiring and hosts no
  specs or browser tests — its `playwright` dependency is only the browser runner that
  `@storybook/addon-vitest` uses to render stories.
- **Why all three CI uploads go through `chromaui/action`:** the action forwards the `pull_request`
  event (head sha, branch, repository) to Chromatic. Running the bare CLI from a `pull_request`
  checkout logged `Branch '<branch>' does not exist … Falling back to <sha> … Pull request status
updates likely won't work properly`, and TurboSnap fell back to an unrelated baseline. The
  checkouts also use `ref: ${{ github.event.pull_request.head.ref }}` so the workspace holds the
  PR branch rather than GitHub's ephemeral merge commit, as Chromatic's TurboSnap guidance asks.

## Local Chromatic runs

```bash
# Storybook: publish + snapshot from your machine (token from the Chromatic project's Manage page)
CHROMATIC_PROJECT_TOKEN=<storybook-token> pnpm --filter sanity-storybook chromatic

# Vitest capture (capturing is gated behind CHROMATIC=1; chromium is auto-selected):
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

- The plugin is registered in `packages/sanity/vitest.browser.config.mts` on every run, so
  `configure()` and `takeSnapshot()` from `@chromatic-com/vitest` are usable in any test file
  (`takeSnapshot()` throws `TypeError` in a chromium test the plugin is not registered for;
  both are no-ops on firefox/webkit). `CHROMATIC=1` switches the plugin from "helpers only" to
  capturing: automatic end-of-test snapshots on, `turboSnap` stats on, reporter on, the
  per-test fonts/network-idle wait on, telemetry on (off otherwise via
  `CHROMATIC_DISABLE_TELEMETRY`). Measured on 25 files in chromium, the always-registered
  plugin costs about a second over 63s. `@chromatic-com/vitest` is pre-bundled through
  `deps.optimizer.client.include` so the first test file to import it cannot trigger a mid-run
  re-optimization (which reloads the page and fails the file with "Vitest failed to find the
  current suite").
- Capture is chromium-only (plugin requirement; Chromatic re-renders archives in its own
  standardized cloud browser). The config throws if `SANITY_VITEST_BROWSER` is set to another
  browser while `CHROMATIC=1`.
- One archive per test case that ran (skipped tests capture nothing). In the Chromatic build the
  component title is the test file path (`src/core/releases/tool/components/Table/__tests__/Table`)
  and the snapshot name is the `describe` / `it` chain plus `Snapshot #1`, so a test's title is
  its snapshot's name — keep `it(...)` titles descriptive.
- Inside browser tests (from `@chromatic-com/vitest`):
  - `configure({title, delay, disableAutoSnapshot, diffThreshold, ...})` — file scope when
    called at the top level of the module, suite scope inside `describe()`, test scope inside
    `test()`. `title` fixes ambiguous build-table names.
  - `await takeSnapshot('state name')` — targeted mid-test snapshots (e.g. menu open, mid-drag).
    Un-awaited calls fail the test at the end (`PendingSnapshotsError`).
  - Verified against 1.0: a file-level, suite-level and test-level `configure({disableAutoSnapshot:
true})` each produced no archive for the tests they cover; a test with a `takeSnapshot('first
state')` plus its end state produced two archives; the same file in a normal run produced only
    the explicit one, and nothing on firefox.
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
  stats (pnpm lockfiles are supported), and any bump that touches `packages/sanity/package.json`
  additionally re-runs everything through the `src/core/version.ts` edge. That is deliberate:
  do not add `--untraced` for `package.json` or the lockfile to trim it. A bump of a rendering
  dependency such as `@sanity/ui` must re-snapshot every test and story, and relying on the
  lockfile route alone to catch it is not a trade the team wants.
- Chromatic bails to a full build when a changed file cannot be linked to specific tests (the
  Storybook job bails on `dev/storybook/.storybook/preview.tsx` edits the same way); read the
  "TurboSnap disabled due to file change" lines in the job log before assuming tracing is broken.

### Sharding the capture run

The capture job is a single `vitest run` today (34 files, ~90s of test time), so nothing is
merged. If it is ever split with `--shard=<i>/<n>` (Chromatic's
[Vitest sharding guide](https://www.chromatic.com/docs/vitest/sharding/)), four things have to
hold — the last two are not on that page and were verified against `@chromatic-com/vitest` 1.0:

1. **One output directory per shard.** The plugin wipes `.vitest/chromatic` (archives and every
   `preview-stats*.json`) at the start of each non-merge run. Two shards run back to back in one
   checkout leave only the second shard's archives. One runner per shard (a matrix job) is fine;
   locally, point each shard at its own `outputDirectory` or checkout.
2. **Ship the hidden directories.** Upload `packages/sanity/.vitest` (archives plus
   `preview-stats-<i>-<n>.json`) and `packages/sanity/.vitest-reports` (the blob reports, see 3)
   with `include-hidden-files: true`, one artifact per shard; download them all into the same
   paths with `merge-multiple: true`.
3. **Merge the stats before uploading, or TurboSnap traces nothing.** Shards write
   `preview-stats-<i>-<n>.json`, but the archive Storybook the CLI builds only reads
   `preview-stats.json`; with `--only-changed` and no merged file the build has no module graph,
   every changed file traces to zero tests, and Chromatic uploads an empty build that looks green.
   The merge is `CHROMATIC=1 SANITY_VITEST_BROWSER=chromium pnpm exec vitest run -c
vitest.browser.config.mts --merge-reports`, run in the upload job after the download: the
   plugin's merge-reports branch combines the shard stats into `preview-stats.json` and skips the
   wipe, so the archives survive. It needs the shards to have run with `--reporter=default
--reporter=blob` (blob reports land in `.vitest-reports/`), and `CHROMATIC=1` so the plugin is
   loaded at all. Verified locally: shards 1/2 + 2/2 produced 60 + 58 archives, and the merge
   produced the same 118 archives and a `preview-stats.json` with the same 4545 modules / 32 test
   files as an unsharded run. The merged console summary under-counts tests; only the stats and
   archives matter here.
4. **Upload once**, from `packages/sanity`, with `chromatic --vitest --only-changed`. The
   `Check TurboSnap stats file` step in `chromatic.yml` fails the job when `preview-stats.json`
   is missing, which catches both a forgotten merge and a dropped `turboSnap: true`.

The `browser-tests.yml` matrix shards by browser, not by `--shard`, and the capture run is
chromium-only, so it is unaffected by any of this.

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
  merges shard artifacts and uploads once through `chromaui/action` (`playwright: true`,
  `CHROMATIC_ARCHIVE_LOCATION` pointing at the merged copy) with `CHROMATIC_PROJECT_TOKEN_E2E`.

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
