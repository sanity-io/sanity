# Visual Regression Reference

## Architecture and rationale

- **Why harness reuse instead of moving tests into Storybook:** the 25 `*.browser.test.tsx`
  files use `vitest-browser-react`, custom server commands (`readFileAsBase64`), clipboard/PTE
  helpers and mid-test `page.viewport()` mutations — none of which map onto Storybook `play()`
  functions. They were also already migrated once (Playwright CT → vitest browser mode). So the
  `*Story.tsx` harness components stay shared: tests drive interactions, Storybook/Chromatic
  snapshot rendered states, and `@chromatic-com/vitest` (once active) snapshots test end states
  in place with zero test changes.
- **Why the storybook Vite config mirrors `vitest.browser.config.mts`:** the `monorepo` exports
  condition resolves `sanity` (and other workspace packages) to TypeScript source; the
  vanilla-extract plugin compiles `.css.ts`; the React Compiler babel preset matches what the
  studio ships. Divergence here would make snapshots render differently from production.
- **Why stories are co-located:** each package owns its CSF files and keeps component, fixture,
  test-harness, and test-only imports within the same workspace boundary. `dev/storybook` is only
  the shared host; its discovery globs target workspace package `src` roots without traversing
  dependency symlinks under nested `node_modules` directories.
- **Why preview imports both `ui5/styles.css` and `@sanity/ui/styles.css`:** the studio entry
  side-effect-imports both. Storybook must too — colocated sentinel stories import source files
  directly and never hit the `sanity` package entry, so they would otherwise snapshot without
  the ui5 reset and design tokens.
- **One Chromatic project per integration type** (Chromatic constraint): `sanity` (Storybook),
  `sanity_e2e` (Playwright), plus a Vitest-type project once early access lands.

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
  and read-only states** — document form states are covered by the Storybook harness stories
  instead.
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
