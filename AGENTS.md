# AGENTS.md - AI Agent Guidelines for Sanity Monorepo

This document helps AI agents work successfully with the Sanity monorepo.

> **Self-Improvement:** If you discover undocumented requirements, commands, or workflows during your work (e.g., a reviewer asks you to run something not covered here), update this file on the same PR. Keep this guide accurate and helpful for future agents.

## Prerequisites

- **Node.js**: v24 or latest LTS. Published packages must declare `"engines": { "node": ">=22.12" }` (`pnpm normalize-pkgfields` keeps this in sync; publint warns if the field is missing).
- **Package Manager**: pnpm v10+ (exact version managed via `packageManager` field in package.json)

## Quick Reference

```bash
# Install dependencies (pnpm ONLY - enforced)
pnpm install

# Build all packages (required before testing)
pnpm build

# Run dev studio (requires auth, see below)
pnpm dev

# Format code (MUST pass CI)
pnpm chore:format:fix

# Fix all lint issues (MUST pass CI) — includes TypeScript type checking via oxlint
pnpm lint:fix

# Run tests
pnpm test

# Update snapshots if tests fail due to expected changes
pnpm test -- -u

# Lint + type check (oxlint typeAware + typeCheck; no separate tsc step)
pnpm check:oxlint
```

## CI Checks - What Must Pass

These checks run on every PR and **must pass**:

| Check            | Command               | Notes                                                                                                                                                            |
| ---------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Format**       | `pnpm check:format`   | Uses oxfmt. Fix with `pnpm chore:format:fix`                                                                                                                     |
| **Oxlint**       | `pnpm check:oxlint`   | Rust linter with type-aware rules and TypeScript type checking via tsgolint (`options.typeCheck`). Fix with `pnpm chore:oxlint:fix`                              |
| **Unit Tests**   | `pnpm test`           | Vitest, sharded in CI                                                                                                                                            |
| **Export Tests** | `pnpm test:exports`   | Ensures ESM/CJS/DTS work                                                                                                                                         |
| **Dep Check**    | `pnpm depcheck`       | Finds unused/missing deps                                                                                                                                        |
| **Zizmor**       | `pnpm lint:workflows` | Audits `.github/workflows/` for security issues. Fails CI on high-severity findings. Local run needs [`zizmor`](https://docs.zizmor.sh/installation/) on `PATH`. |
| **PR Title**     | Conventional commits  | e.g., `feat(scope): description`                                                                                                                                 |

### Before Committing

Run these commands to avoid CI failures:

```bash
# Fix all formatting and lint issues
pnpm lint:fix

# Verify tests pass (build first if needed)
pnpm build && pnpm test
```

If tests fail due to **expected snapshot changes**, update them:

```bash
pnpm test -- -u
```

Snapshot files are located in `__snapshots__` directories alongside test files.

## Project Structure

```
sanity/
├── packages/
│   ├── sanity/           # Main Sanity studio package
│   ├── @sanity/          # Scoped packages (cli, types, schema, etc.)
│   └── @repo/            # Internal tooling (test-config, tsconfig, etc.)
├── dev/                  # Development studios for testing
│   ├── test-studio/      # Primary dev studio (pnpm dev runs this)
│   ├── studio-diagnostics-viewer/ # Standalone viewer for pasted diagnostics JSON
│   └── preview-iframe/   # Presentation preview iframe (vanilla Vite, port 3334)
├── e2e/                  # End-to-end Playwright tests
├── perf/                 # Performance testing
└── examples/             # Example studios
```

### Key Packages

- **`packages/sanity`** - Core studio package with all UI components
- **`packages/@sanity/types`** - TypeScript type definitions
- **`packages/@sanity/schema`** - Schema compilation
- **`packages/@sanity/mutator`** - Document mutation logic

## Build System

- **Package Manager**: pnpm (version 10.x, enforced via `preinstall`)
- **Build Orchestration**: Turbo (caches builds)
- **Versioning**: Lerna-lite with conventional commits

### Build Commands

```bash
pnpm build              # Build all packages
pnpm watch              # Watch mode for development
```

### Running the Dev Studio

```bash
pnpm dev                # Starts dev studio at http://localhost:3333
```

**Note:** The dev studio requires Sanity user authentication in the browser. It's a Vite application that communicates with Sanity API endpoints, so you'll need to log in with a Sanity account when you access `http://localhost:3333` to use the studio.

## Local Development

This section clarifies what requires authentication and what doesn't—critical for AI agents to avoid getting stuck on auth flows.

### Running Tests (No Auth Required)

Unit tests run in jsdom with mocks and **do not require any authentication**:

```bash
# Build first (required), then run all tests
pnpm build && pnpm test

# Run a single test file (IMPORTANT: use vitest directly with --project to avoid running all tests)
pnpm vitest run --project=sanity packages/sanity/src/core/hooks/useClient.test.ts

# Run a single test file with verbose output
pnpm vitest run --project=sanity --reporter=verbose packages/sanity/src/core/hooks/useClient.test.ts

# Watch mode for iterative development
pnpm test -- --watch

# Run tests for a specific package
pnpm test -- --project=sanity
```

**Important:** Do NOT use `pnpm test -- path/to/file.test.ts` for running a single file — it runs all tests across all projects. Use `pnpm vitest run --project=<project> <path>` instead.

Components that need auth context use `createMockAuthStore` in tests, so no real authentication is needed. This is the recommended way to verify most code changes.

### Running the Dev Studio (Auth Required)

```bash
pnpm dev  # Starts test-studio at http://localhost:3333 and preview-iframe at http://localhost:3334
```

- **Requires browser authentication** on first visit—you'll be prompted to log in with a Sanity account
- Connects to a real Sanity project (configured in `dev/test-studio/sanity.config.ts`)
- Uses staging API by default (`api.sanity.work`)
- Session persists in browser, so subsequent visits won't require re-authentication
- `pnpm dev` / `pnpm dev:test-studio` also starts `dev/preview-iframe` (vanilla Vite on port 3334) so Presentation can load its cross-origin iframe. Studio-only: `pnpm dev:test-studio:studio`. Preview-only: `pnpm dev:preview-iframe`.
- Deployed preview iframe: Sanity Sandbox Vercel project `test-studio-preview-iframe` (`https://test-studio-preview-iframe.sanity.dev`)

Use the dev studio when you need to:

- Visually verify UI changes
- Test real document editing workflows
- Debug issues that only appear with real data
- Exercise Presentation / visual editing against the local preview iframe

### Inspecting Production Builds with Vite DevTools

The test studio can run with [Vite DevTools](https://devtools.vite.dev) enabled, which lets you inspect the output of `sanity build` runs (module graph, chunks, plugin timings, bundle treemaps, session diffing) from inside a long-running `sanity dev` server—no restart needed.

```bash
# Builds the test studio with devtools enabled, then starts the dev server
# (so there's a build session to inspect right away)
pnpm devtools:test-studio
```

Open `http://localhost:3333` and use the Vite DevTools dock to explore the recorded Rolldown build session. See the [DevTools for Rolldown features guide](https://devtools.vite.dev/rolldown/features.html) for how to use the module graph, chunk, asset, and plugin panels.

To inspect a **new** build after making changes—while `pnpm devtools:test-studio` is still running—run in a second terminal:

```bash
# Creates a fresh build session that shows up in the running DevTools dock
pnpm devtools:test-studio:build
```

Builds are not hooked into HMR; `sanity build` must be invoked manually (via the command above) each time you want a new session to inspect. Sessions can be compared against each other in the DevTools UI to diff bundle changes.

How it works:

- Both commands set `ENABLE_VITE_DEVTOOLS=true`, which makes `dev/test-studio/sanity.cli.ts` add the `DevTools()` Vite plugin and enable `build.rolldownOptions.devtools`
- Build sessions are written to `dev/test-studio/node_modules/.rolldown` (gitignored)
- The flag is declared in `dev/test-studio/turbo.json` so turbo-cached builds are invalidated when it changes
- Enabling devtools makes `sanity build` noticeably slower; that's why it's opt-in via the env flag

### Analyzing the `sanity` package bundle

The `sanity` package tsdown build can emit a Rolldown [bundle analyzer](https://rolldown.rs/builtin-plugins/bundle-analyzer) markdown report (module/chunk breakdown for humans and coding agents) when `ENABLE_BUNDLE_ANALYZER=true`:

```bash
pnpm analyze:sanity
```

The report is written to `packages/sanity/lib/analyze-data.md` (gitignored with `lib/`). The flag is opt-in because analysis adds work to the package build; it is declared in `packages/sanity/turbo.json` so turbo-cached builds are invalidated when it changes. Wiring is `@sanity/tsdown-config`'s `bundleAnalyzer` option (`true` selects markdown).

### Studio performance benchmarks (perf/bench — No Auth Required)

The `perf/bench` suite benchmarks a built studio against a **local mock** of the Sanity API — fully hermetic, no tokens, no network:

```bash
pnpm build:bench                                   # build packages + bench studio (required first)
pnpm bench help                                    # list all bench CLI commands
pnpm bench run --scenario singleString             # absolute interaction benchmark
pnpm bench run --mode pageload --scenario singleString  # load vitals + bundle size
pnpm bench:unit                                    # mock-contract + stats unit tests
pnpm bench dev                                     # mock + `sanity dev` for interactive debugging
```

See `perf/bench/README.md` for A/B comparisons, scenarios, and CI details. (The legacy `dev/efps` suite has been decommissioned; perf/bench replaces it.)

### E2E Tests (Token Required)

E2E tests require authentication tokens. Add these to `.env.local` in the repo root:

```bash
SANITY_E2E_SESSION_TOKEN=<your-token>
SANITY_E2E_PROJECT_ID=<project-id>
SANITY_E2E_DATASET=<dataset-name>
```

**How to get a token:**

```bash
# Option 1: Use your CLI token
sanity login
sanity debug --secrets  # Look for "Auth token"

# Option 2: Create a project token at https://sanity.io/manage
# Navigate to: Project Settings → API → Tokens → Add API token
```

Then run E2E tests:

```bash
pnpm e2e:build              # Build E2E studio
pnpm test:e2e               # Run E2E tests
pnpm test:e2e --ui          # Interactive mode
```

**Note:** E2E tests are typically run in CI, not locally during development. Most changes can be verified with unit tests.

When CI e2e fails, the hosted Playwright report also serves a machine-readable digest at `<report-url>/agent-report.md` (error messages, code snippets, and Playwright `error-context` page snapshots). The PR comment includes a **Share with an AI agent** fenced prompt pointing at that URL (GitHub's copy button copies the whole prompt).

### Important Note for AI Agents

**What requires authentication:**

- Running the dev studio (`pnpm dev`)
- E2E tests (`pnpm test:e2e`)
- Any command that connects to Sanity APIs

**What does NOT require authentication:**

- Building packages (`pnpm build`)
- Running unit tests (`pnpm test`)
- Linting, formatting, and type checking (`pnpm lint`, `pnpm lint:fix`, `pnpm check:oxlint`)

**Recommendation:** For most code changes, use `pnpm build && pnpm test` to verify correctness. This covers the vast majority of development tasks without any auth setup. Only use the dev studio when visual verification is specifically needed.

## Coding Standards

Coding standards are enforced by **oxlint** (native Rust rules, type-aware rules via tsgolint, TypeScript type checking via `options.typeCheck`, and a few ESLint plugins loaded through oxlint's `jsPlugins`). TypeScript type checking is included in `pnpm lint` / `pnpm check:oxlint` — no separate `tsc` step. Check your code with:

```bash
pnpm lint              # Check for issues (oxlint, includes type checking)
pnpm lint:fix          # Auto-fix issues (oxfmt + oxlint --fix)
```

All packages use **ESM** (`"type": "module"`). TypeScript strict mode is enabled.

Rules that the linter already enforces (restricted imports, type-aware rules, React Compiler rules, i18n rules, module boundaries) are not repeated in this guide — run `pnpm lint` and follow the reported messages, which explain the expected pattern.

### Do Not Weaken the Linter

Fix the reported problem instead of silencing it. In order of preference:

1. **Fix the code** so the rule passes. This is almost always the right answer.
2. **Suppress the single line** as a last resort, when the rule is genuinely wrong for that one spot: `// oxlint-disable-next-line <rule> -- <why>`. Always name the specific rule and explain the exception after `--`. Never suppress a rule merely to make CI green.
3. **Change `.oxlintrc.json` only when a human explicitly asks.** Do not turn rules off, downgrade severity, add `overrides` entries, or widen `ignorePatterns` on your own initiative — an override silences the rule for every current and future file it matches. If you think a rule is wrong, leave it failing and raise it in your summary or the PR description.

File-wide `/* oxlint-disable <rule> */` is reserved for files that are an exception as a whole — vendored code, the `packages/sanity/src/ui-components` wrappers around raw `@sanity/ui`, CLI scripts that print to `console`. Follow that existing precedent rather than reaching for it to clear a handful of errors.

`options.reportUnusedDisableDirectives` is `error`, so a suppression that stops being necessary fails CI — drop suppressions when the code underneath them changes.

### Effect events: use `use-effect-event`, not React's native hook

Import `useEffectEvent` from `use-effect-event`, never from `react`. On React 19.2 the native hook
returns first-render values when the calling component is wrapped in `forwardRef` or `memo`
([facebook/react#34818](https://github.com/facebook/react/issues/34818), fixed in 19.3 canaries).
`eslint/no-restricted-imports` in `.oxlintrc.json` enforces this. The bug reaches any dependency that
wraps the native hook, so check the implementation before trusting one — `react-rx` is safe on both
v4 and v5 because `useObservableEvent` builds on the same `use-effect-event` ponyfill.

The dependency is pinned to exactly `1.0.2` in `packages/sanity` and `@sanity/vision`: version 2
returns a new function identity on every render, so any `useEffect` dependency array containing the
event re-fires its effect on each render, and React Compiler inserts the event into the dependency
arrays it generates. `packages/sanity/src/core/hooks/useEffectEvent.test.tsx` enforces the pin: it
fails on any bump attempt, asserts the installed React is a 19.2.x affected by facebook/react#34818,
and carries a canary that fails once React fixes that bug. Update the pin, those tests, and this
section together.

### Translate: never define `components` inline

Components passed to `<Translate>`'s `components` map must be stable, module-scope components —
defining them inline during render creates a new component identity every render and remounts
the subtree. Pass render-scoped data through the `componentProps` prop instead, and map plain
HTML wrappers as strings (eg `{Code: 'code'}`). The in-repo oxlint rule
`@repo/i18n/no-inline-translate-components` (see `packages/@repo/oxlint-plugin-i18n`) enforces
this for object literals in the JSX attribute; maps built during render via `useMemo` or factory
functions are equally wrong even though the rule cannot see them. See the `sanity-i18n-translate`
skill (`.agents/skills/sanity-i18n-translate/SKILL.md`) for the full conversion patterns.

### Refs: use `props.ref`, not `forwardRef`

React 19 passes `ref` as a regular prop. Do not use `forwardRef` — destructure `ref` from props
(so it is not left in a `...rest` spread) and forward it like any other prop.
`eslint/no-restricted-imports` bans importing `forwardRef` from `react`.

Prefer a named function declaration over `const X = function …` / arrow wrappers:

```ts
// preferred
export function MyComponent(props: Props & RefAttributes<HTMLDivElement>) {
  const {ref, ...rest} = props
  return <div ref={ref} {...rest} />
}

// avoid
export const MyComponent = function MyComponent(props: …) { … }
export const MyComponent = (props: …) => { … }
```

When wrapping with `memo`, declare the component as a function first, then memoize:

```ts
function MyComponent(props: …) { … }
export const MyComponentMemo = memo(MyComponent)
```

Do not assign `.displayName` on components, HOCs, styled components, or `createContext`
results. That property write is a module-level side effect and keeps the export from being
tree-shaken. Named function declarations already give React DevTools a name via
`function.name`. Exception (temporary): document/badge hooks prefixed with `use` and the
HookState collection still set `displayName` — leave those until that API is reworked.

For typings, include `ref` on the props type: stop omitting `'ref'` from `HTMLProps` /
`ComponentProps`, or intersect with `RefAttributes<T>`. Avoid `PropsWithRef` — in `@types/react`
19 it is a deprecated identity alias and trips `typescript/no-deprecated`.

## Testing

### Unit Tests (Vitest)

```bash
pnpm test                    # Run all tests
pnpm test -- --watch        # Watch mode
pnpm test -- -u             # Update snapshots
pnpm test -- --project=sanity  # Run specific project
```

Tests require a build first because some tests use compiled output:

```bash
pnpm build && pnpm test
```

#### Test Timeouts

When a test needs a custom timeout, use the Vitest options object as the second argument (not the deprecated third-argument form). Prefer numeric separators for readability:

```ts
// Correct
test('my test', {timeout: 30_000}, async () => {
  // ...
})

// Wrong — timeout as third argument (deprecated)
test('my test', async () => {
  // ...
}, 30000)
```

#### Testing components that suspend via `use()`

Two traps when unit testing a component or hook that suspends on a promise with React's `use()`
(see `packages/sanity/src/presentation/__tests__/useMainDocumentPolyfill.test.tsx`):

- **Mount inside an awaited async `act`.** `render`/`renderHook` wrap the mount in an internal
  _synchronous_ `act`, and React refuses to resume work that suspended inside an unawaited `act`
  scope — the suspended tree parks forever and `waitFor` times out. Wrap the mount yourself:
  `await act(async () => { renderHook(...) })` (suppress `testing-library/no-unnecessary-act` on
  that line; this is the exception the rule doesn't know about). A `Suspense` wrapper is also
  required.
- **Keep the `use()` call sequence stable across the replay.** After the promise settles, React
  _replays_ the suspended render reusing the recorded hook state. If the awaited promise's side
  effect flips the condition guarding a conditional `use()` (e.g. a polyfill import that installs
  a global the condition checks), the replay skips the `use()` call, hook accounting breaks, and
  React throws `Update hook called on initial render` as a recoverable error — which vitest can
  catch as an unhandled error and fail the run. Once a load has started, keep calling `use()` on
  the same cached promise on every render instead of re-checking the environment.

#### Custom matchers shipped in node_modules (e.g. `get-it/vitest`)

TypeScript 7 (the root `tsc` and oxlint's `typeCheck`) currently mis-scopes `declare module`
augmentations shipped in node_modules `.d.ts` files: the file that directly contains the
side-effect import (e.g. `import 'get-it/vitest'`) does not see the augmented types and gets
TS2339 on every matcher, while every other file in the same program sees them fine.
TypeScript 6 applies the augmentation in both cases. Workaround: put the side-effect import in
a vitest setup file (registered via `test.setupFiles`) instead of the test file that uses the
matchers — see `packages/@sanity/schema/test/setup.ts` and its `vitest.config.mts`.

#### Vanilla-extract in jsdom tests

The `sanity` and `@sanity/vision` jsdom suites import
[`@vanilla-extract/css/disableRuntimeStyles`](https://vanilla-extract.style/documentation/test-environments/#disabling-runtime-styles)
(`packages/sanity/test/setup/environment.ts`, and as a direct vitest `setupFiles` entry in
`packages/@sanity/vision/vitest.config.mts`), so vanilla-extract skips injecting real stylesheets
into jsdom. Class name identifiers still resolve, but computed styles are not available.

Conventions that follow from this:

- **Do not assert on vanilla-extract class names or computed styles in jsdom tests.** Assert on
  `data-testid` attributes instead. Visual/style behavior belongs in the vitest browser mode
  suite (`*.browser.test.tsx`, real Chromium/Firefox/WebKit) or the Playwright e2e tests, where
  runtime styles stay enabled.
- **Keep `vanillaExtractPlugin()` in the vitest configs.** The plugin's transform assigns file
  scopes to `.css.ts` modules; without it any test that (transitively) imports a `.css.ts` file
  throws "Styles were unable to be assigned to a file". `disableRuntimeStyles` only skips style
  injection, not the transform.

#### @sanity/ui overlays stay mounted when closed

From `@sanity/ui` v4, Tooltip/Popover/Menu keep their content mounted via React `<Activity>`
while closed (hidden with `display: none`). Consequences for tests:

- Plain text / test-id queries can match **closed** overlay content. Prefer scoping to the
  visible element under test (or assert visibility) instead of `getByText` / `getByTestId` on
  the whole document.
- In jsdom, asserting that closed content is hidden works (`expect(...).not.toBeVisible()`), but
  selecting the **open** overlay by visibility does not. Runtime styles are disabled there, so
  nothing overrides the `hidden` attribute `@sanity/ui` puts on an open popover, and
  `getByRole` (which skips inaccessible nodes) finds neither the open nor the closed copy. Pick
  the open one by the absence of the `display: none` that `<Activity>` applies to closed
  overlays, rather than by index:

  ```ts
  const [openMenu] = getAllByDataUi(document.body, 'MenuButton__popover').filter(
    (popover) => popover.style.display !== 'none',
  )
  const item = within(openMenu).getByRole('menuitem', {name: 'Discard version', hidden: true})
  ```

  Selecting with `getAllByText(...)[0]` also works, but silently depends on portal ordering.
  Visibility-based selection belongs in the browser-mode suite, where real styles apply and
  `checkVisibility()` is meaningful.

- Test routers must include intent routes (`route.create('/', [route.intents('/intent')])`).
  Reference item menus render `IntentLink` ("Open in new tab") even while closed; without
  intent routes, `resolveIntentLink` throws during render and the form subtree disappears.
  See `packages/sanity/test/browser/TestWrapper.tsx` and `test/testUtils/TestProvider.tsx`.

### Visual Regression Tests (Chromatic + Storybook)

Visual regression runs on Chromatic via `.github/workflows/chromatic.yml`. Stories are co-located
with their source under `packages/**/src/**/__tests__`; most reuse vitest browser-mode test
harnesses (`TestWrapper` + `*Story.tsx` components), alongside authored migration sentinels for
`ui-components` and vanilla-extract-migrated components. `dev/storybook` contains the shared
Storybook, Chromatic, and addon-vitest infrastructure.

```bash
pnpm dev:storybook                    # Storybook dev server at http://localhost:6006
pnpm build:storybook                  # Static build via turbo (dev/storybook/storybook-static)
pnpm --filter sanity-storybook test   # Run every story as a vitest browser-mode test
CHROMATIC=1 pnpm --filter sanity test:browser   # Chromatic archive capture run (chromium only)
```

Repo secrets: `CHROMATIC_PROJECT_TOKEN_STORYBOOK` (active), `CHROMATIC_PROJECT_TOKEN_E2E`
(active, used by e2e), `CHROMATIC_PROJECT_TOKEN_VITEST` (dormant until Chromatic's Vitest early
access is enabled — the CI job self-activates when the secret is added). Checks are non-gating
during burn-in. See the `sanity-visual-regression` skill
(`.agents/skills/sanity-visual-regression/SKILL.md`) for how to add coverage, determinism rules,
and the Vitest activation runbook.

### E2E Tests (Playwright)

```bash
pnpm e2e:build              # Build E2E studio
pnpm test:e2e               # Run E2E tests
pnpm test:e2e --ui          # Interactive mode
```

## Pre-commit Hook

Lefthook runs on commit (see `lefthook.yml`), which:

1. Runs oxfmt on staged files
2. Runs oxlint `--fix` on staged `.js/.ts/.tsx` files (with `--no-error-on-unmatched-pattern` so packages in oxlint `ignorePatterns`, e.g. `@repo/test-dts-exports`, can still be committed)

If the hook fails, run `pnpm lint:fix` to fix issues.

## Common Tasks

### Adding a New Dependency

```bash
# Add to specific package
pnpm --filter sanity add <package>

# Add to root (dev dependency)
pnpm add -w -D <package>
```

Catalog versions live in `pnpm-workspace.yaml`. After changing a catalog specifier, run `pnpm install` to refresh `pnpm-lock.yaml`.

The workspace sets `minimumReleaseAge: 1440` (1 day) and also rejects **already-locked** versions younger than that. If `pnpm install` fails with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` for a package you intentionally bumped, add that package to `minimumReleaseAgeExclude` in `pnpm-workspace.yaml` with a short comment. Do not disable the age gate globally.

### Testing an Unreleased Dependency Fix (pnpm patch)

To validate an upstream PR of a dependency before it is released (example: [sanity#14234](https://github.com/sanity-io/sanity/pull/14234) vendoring react-rx#506):

```bash
# 1. Build the dependency's dist from its PR branch (in a separate clone)
git clone <repo> /tmp/dep && cd /tmp/dep && git fetch origin pull/<n>/head && git checkout FETCH_HEAD
pnpm install && pnpm --filter <pkg> build

# 2. Patch the locked version in this repo
pnpm patch <pkg>@<version> --edit-dir /tmp/patch-edit
cp /tmp/dep/packages/<pkg>/dist/* /tmp/patch-edit/dist/
pnpm patch-commit /tmp/patch-edit
```

Notes:

- `pnpm patch-commit` writes `patches/<pkg>@<version>.patch` and a `patchedDependencies` entry in `pnpm-workspace.yaml` — commit both plus `pnpm-lock.yaml`
- Key the patch by exact version (`<pkg>@<version>`) so other locked versions of the same package stay untouched
- Record the upstream commit sha in the commit/PR so the patch is reproducible
- The patch is an experiment vehicle: before merging, land + release the upstream fix, bump the catalog, drop the patch

### Creating a New Test

1. Create test file next to source: `MyComponent.test.tsx`
2. Use existing test patterns from similar files
3. Run `pnpm test -- MyComponent` to verify

### Updating Snapshots

When making intentional changes that affect snapshots:

```bash
# Update all snapshots
pnpm test -- -u

# Update specific test's snapshots
pnpm test -- -u MyComponent
```

Review snapshot changes carefully before committing.

## Commit Message Format and PR Title (CRITICAL)

This repo uses **conventional commits** for automated releases.

**PR titles are validated by CI** using the [semantic-pull-request](https://github.com/amannn/action-semantic-pull-request) action. A PR with a non-conforming title **will fail CI**.

### Format

```
type(scope): lowercase description without special characters
```

### Rules

1. **Type** is required and must be one of: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`
2. **Scope** is required and should be the package or area affected (e.g., `groq`, `cli`, `form`, `deps`)
3. **Description** must start with a lowercase letter
4. **No backticks, quotes, or markdown** in the PR title — keep it plain text
5. Use `fix` for bug fixes, `feat` for new features, `chore` for maintenance tasks

### Choosing the Right Type

- **`fix`** — Fixes a bug or resolves an issue (e.g., `fix(groq): resolve CJS type export issue`)
- **`feat`** — Adds new functionality (e.g., `feat(form): add array input component`)
- **`chore`** — Maintenance, dependency updates, CI changes (e.g., `chore(deps): update dependencies`)
- **`docs`** — Documentation only (e.g., `docs(readme): improve installation instructions`)
- **`refactor`** — Code restructuring without behavior change (e.g., `refactor(store): simplify document subscription logic`)
- **`test`** — Adding or updating tests (e.g., `test(validation): add edge case coverage`)
- **`perf`** — Performance improvements (e.g., `perf(search): optimize query execution`)
- **`ci`** — CI/CD changes (e.g., `ci(e2e): add retry logic to flaky tests`)

### Examples

```
# ✅ Good PR titles
fix(groq): resolve CJS type export issue
feat(form): add new array input component
chore(deps): update dependencies

# ❌ Bad PR titles
feat(groq): add `types` condition     # no backticks allowed
Fix(cli): Handle missing config        # type must be lowercase, description must start lowercase
added new feature                       # missing type and scope
```

## Pull Request Workflow

### 1. Create as Draft PR First

**Always create PRs as drafts first.** The prompter (person who requested the work) reviews before the broader team.

```bash
# Create a draft PR — title MUST follow conventional commit format
gh pr create --draft --title "fix(scope): description" --body "..." --label "🤖 bot"
```

### 2. Apply the "🤖 bot" Label

**All PRs created by AI agents must be labeled with `🤖 bot`.** This label already exists on the repo and helps the team identify agent-created PRs for tracking and review workflows.

When creating or updating a PR, always ensure the label is applied. If the create command did not accept `--label`, add it afterward:

```bash
gh pr edit --add-label "🤖 bot"
```

### 3. Move Out of Draft

Once the prompter approves and CI is green, convert from draft to ready-for-review:

```bash
gh pr ready
```

### 4. What Not To Touch Unless Asked

- **`.github/CODEOWNERS`** — do not add or change ownership rules unless explicitly requested
- **Release automation / version bumps** — versioning is driven by conventional commits on merge; do not open manual version PRs unless asked

### Useful PR Labels

| Label                | When to use                                                                          |
| -------------------- | ------------------------------------------------------------------------------------ |
| `🤖 bot`             | **Required** on every AI-agent PR                                                    |
| `trigger: preview`   | Publishes preview packages via [`pkg.pr.new`](https://pkg.pr.new) (maintainer-gated) |
| `trigger:perf-bench` | Runs the `perf/bench` suite on the PR (maintainer-gated)                             |
| `full-test-suite`    | Forces the full unit test suite to run                                               |

Do **not** apply `trigger:*` labels unless the prompter or a maintainer asks — they kick off expensive or publish workflows.

### Crediting Original Authors (Ported / Cherry-picked Work)

When porting or rebasing someone else's PR (community contribution, backport, etc.), credit the **original author**, not only the agent or whoever opens the port PR:

1. Prefer commits authored as the original contributor when history allows:

   ```bash
   git commit --author="their-name <their-github-email>" -m "..."
   ```

2. Otherwise add a `Co-authored-by:` trailer (and mention them in the PR description / Notes for release):

   ```
   Co-authored-by: Their Name <their-github-noreply@users.noreply.github.com>
   ```

Workflow summary:

1. **Agent creates draft PR** with the `🤖 bot` label
2. **Prompter reviews** the draft
3. **Mark ready for review** once the prompter approves
4. **Team reviews** and merges

This ensures the person who prompted the changes can verify correctness before involving the broader team.

## Keeping This Guide Updated

**If you're asked to do something not documented here, update this file.**

When working on a PR and you're asked to:

- Run a command that isn't in this guide
- Follow a workflow that isn't documented
- Fix something using a non-obvious process

Add that knowledge to this `AGENTS.md` file as part of the same PR. This keeps the guide accurate and helps future agents (and humans) avoid the same gaps.

Example: If asked "run the e2e tests for just the form inputs", and that's not documented, add it to the Testing section before completing the task.

## Troubleshooting

### Build Issues

```bash
# Clean everything and rebuild
pnpm clean && pnpm install && pnpm build
```

### Test Failures

1. Ensure you've built: `pnpm build`
2. Check if snapshots need updating: `pnpm test -- -u`
3. Run specific test for better output: `pnpm test -- <test-name>`

### Lint Failures

```bash
# Fix all lint issues
pnpm lint:fix

# Check what would be fixed (dry run)
pnpm check:format
pnpm check:oxlint
```

## Environment Variables

Key env vars used in development:

- `SANITY_STUDIO_PROJECT_ID` - Project ID for dev studio
- `SANITY_STUDIO_DATASET` - Dataset for dev studio
- `SANITY_INTERNAL_ENV` - Internal environment flag
- `ENABLE_BUNDLE_ANALYZER` - When `true`, the `sanity` package tsdown build emits `lib/analyze-data.md` (`pnpm analyze:sanity`)

See `turbo.json` for full list of environment variables that affect builds.

## Useful Links

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Full contribution guidelines
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) - Community guidelines
- [packages/sanity/README.md](./packages/sanity/README.md) - Main package docs

## Cursor Cloud specific instructions

These notes cover non-obvious gotchas for running in the Cursor Cloud VM. The startup update script already runs `pnpm install`.

### Git branch naming

When a Linear issue is provided during the session, include its lowercased id in the branch name: `cursor/<linear-id>-<descriptive-name>-<hash>` (e.g. `cursor/sapp-1234-some-thing-hash`).

### Services

| Service                                           | Port | Purpose                                          |
| ------------------------------------------------- | ---- | ------------------------------------------------ |
| Test studio (`pnpm dev` / `pnpm dev:test-studio`) | 3333 | Local Sanity Studio for manual verification      |
| Preview iframe (`pnpm dev:preview-iframe`)        | 3334 | Cross-origin Presentation preview (vanilla Vite) |
| Storybook (`pnpm dev:storybook`)                  | 6006 | Visual regression stories (Chromatic)            |

No Docker, databases, or other local services are required for unit tests, lint, or build. CI-style verification (`pnpm lint`, `pnpm build`, `pnpm test`) runs entirely in-process.

### Gotchas

- **Root `typescript` is TypeScript 7.** Catalog `typescript` (^7) is a normal root dependency and provides the native `tsc` binary for vitest typecheck (`*.test-d.*`) and for tsdown `dts: {tsgo: true}` (packages also declare catalog `typescript`). CI type checking of application code is owned by oxlint (`options.typeCheck`). Tools that still need the TypeScript 6 compiler API keep that isolated: `@repo/typedoc` (typedoc) and `@repo/test-dts-exports` (ts-morph) depend on `typescript` aliased to `@typescript/typescript6`. The old symlink workaround for a missing root `tsc` is no longer needed.
- **Dev studio auth for cloud agents — use the `STUDIO_AUTH_TOKEN` secret, not interactive login.** `pnpm dev` runs `sanity dev --no-auto-updates` (non-interactive, no upgrade prompt) and serves the app at `http://localhost:3333`. The test studio connects to Sanity Cloud (project `ppsg7ml5`); its default workspace is `/test`. Without auth the workspaces show "Signed out" / "Choose login provider". To authenticate, put the injected `STUDIO_AUTH_TOKEN` in the URL hash — Sanity consumes it on load and strips it from the address bar:
  - Build the URL: `node -e "console.log('http://localhost:3333/test#token=' + encodeURIComponent(process.env.STUDIO_AUTH_TOKEN))"` (any workspace basePath works, e.g. `/test`).
  - Because the Read tool redacts the token, you cannot paste the URL into browser instructions directly. A reliable trick is a tiny local HTTP server that reads `STUDIO_AUTH_TOKEN` from env and serves an HTML page doing `location.replace(<studio-url-with-token>)`, then point the browser at that server (keeps the secret out of prompts/screenshots). After load you land authenticated in the workspace and can create/publish documents (e.g. an `Author`).
  - Most changes should still be verified with `pnpm build && pnpm test` (no auth needed); only use the studio for visual/manual verification.
- **Seeding test documents for the `/test` workspace via API.** In local dev (non-staging), the `/test` workspace talks to the production API host, so `STUDIO_AUTH_TOKEN` works as a Bearer token against `https://ppsg7ml5.api.sanity.io/v2024-01-01/data/mutate/test` (it returns 401 "Session not found" on `api.sanity.work`). Caveat when testing history/review-changes features: documents created by raw API mutations (e.g. `createOrReplace` of a published id) do not produce publish events, so the Review changes inspector shows "There are no changes" / "Same revision selected". Instead, create only the draft (`drafts.<id>`) via the API, click Publish in the studio UI to create a real publish event, then edit fields in the form to create draft changes.
- **Seeding releases for the `/test` workspace via API.** Releases and document versions are created through the actions endpoint (`POST https://ppsg7ml5.api.sanity.io/v2025-02-19/data/actions/test` with `{"actions": [...]}`, same Bearer token). Useful action types: `sanity.action.release.create`, `sanity.action.document.version.create` (pass `publishedId` plus a `document` with `_id: versions.<releaseId>.<publishedId>`), `sanity.action.document.version.unpublish`, `sanity.action.document.version.discard`, `sanity.action.release.archive`, `sanity.action.release.delete`. Note that a version created by the unpublish action alone is an empty tombstone carrying only `_system.delete: true` — to get a version with content, create the version first and then unpublish it. `/test` is a shared dataset, so archive and delete any release you seed once you are done.
- **Vitest browser mode (`*.browser.test.tsx`) needs a Playwright browser install first.** The VM has no browsers preinstalled: run `pnpm --filter sanity exec playwright install chromium`, then run a single file with `SANITY_VITEST_BROWSER=chromium pnpm --filter sanity exec vitest run -c vitest.browser.config.mts <path>`. Without `SANITY_VITEST_BROWSER` the config tries chromium, firefox, and webkit. No package build is required for these tests (they resolve monorepo sources).
- **Install agent skills with `pnpm dlx skills`, not `npx skills`.** This repo is pnpm-only, and the Cloud VM's `npx` wrapper often fails with `sh: 1: skills: not found`. Use the pnpm equivalent and skip prompts:

  ```bash
  export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
  pnpm dlx skills add <owner/repo> --skill <name> -y
  pnpm dlx skills add <owner/repo> -y   # all skills in the repo
  pnpm dlx skills list
  ```

- **Node version:** the VM runs Node 22.x, which satisfies the repo engine range (`>=22.12`). A couple of internal tooling packages print a harmless `Unsupported engine` warning wanting Node `>=22.18`; it does not affect testing or running the studio. However, **`pnpm build` requires Node >= 22.18**: the packages build with `tsdown`, which loads its `tsdown.config.ts` through Node's native TypeScript support and fails on older Node 22.x (e.g. the VM default `v22.14.0`) with `Failed to import module "unrun"`. A new enough runtime is available via nvm: `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"`.
- **`pnpm build` may dirty `packages/sanity/package.json`.** tsdown auto-generates the `inlinedDependencies` field on every build, and in this VM the computed set can differ from what is committed (e.g. `@sanity/sdk` and `zustand` get dropped) even on a clean checkout of `main`. That churn is an environment artifact, not part of your change — revert it with `git checkout -- packages/sanity/package.json` (re-applying any edits of your own) instead of committing it.
- **Timezone-sensitive snapshots in `@sanity/validation`.** `test/dates.test.ts` snapshots render datetimes in `America/Los_Angeles`, and the VM defaults to UTC, so those 4 snapshot tests fail locally with times shifted by the `America/Los_Angeles` offset on any branch. Run with `TZ=America/Los_Angeles pnpm test` or treat the failures as environment artifacts, like the lockfile drift below.
- **`pnpm depcheck` fails on a clean checkout of `main` in the VM** (knip reports the root `lefthook` devDependency as unused, plus a `knip.jsonc` config hint). Baseline before blaming your change: `git stash push -u && pnpm depcheck; git stash pop`.
- **Snapshot lockfile drift can fail `pnpm check:oxlint` in untouched files.** The VM image may have `node_modules` resolved to newer in-range versions than the committed `pnpm-lock.yaml` (e.g. `@sanity/client` 8.4.0 vs the locked 8.3.0), and `pnpm install` — even with `--frozen-lockfile` — keeps rewriting the lockfile to match instead of downgrading. Type errors in files you never touched (e.g. `@sanity/vision`'s `useDatasets.test.ts` missing a `description` field) are this drift, not your change: revert the churn with `git checkout -- pnpm-lock.yaml`, never commit it, and rely on CI (which installs from the committed lockfile) for the authoritative type check of those files.
- **Do not run oxlint type checking (`pnpm check:oxlint`) while the dev studio is running.** Both are memory-hungry and running them concurrently has exhausted the VM's memory and frozen it for hours (unkillable thrashing). Stop `sanity dev` first (Ctrl-C in its tmux session), run the checks, then restart the studio.
- **Simulating Presentation preview failure states.** The `/test` workspace's presentation tool allows any localhost origin (`allowOrigins: ['https://*.sanity.dev', 'http://localhost:*']`), so failure UIs can be triggered deterministically by pointing the preview at a throwaway local server via the `?preview=` search param, e.g. `http://localhost:3333/test/presentation?preview=http%3A%2F%2Flocalhost%3A3398%2F`. A plain HTML page that never runs `@sanity/visual-editing` exercises the overlays connection timeout path (loading overlay → "connecting" status card after 5s → caution card with "Continue anyway" after 3s more); a server that accepts connections but never responds (`createServer(() => {})`) keeps the iframe `load` event from firing and exercises the 15s load timeout → error card → "Retry" path. Note the demo screen recordings are time-compressed, so verify real timings from the `sanity dev` terminal log — the studio pipes browser `console.error` output there with timestamps.
- **Verifying a production studio build (`sanity build`) must happen on an allow-listed origin.** `sanity build` for `dev/test-studio` bundles the _built_ `sanity` package (run `pnpm build` first — only `sanity dev` resolves monorepo sources via the `monorepo` export condition). Serve `dev/test-studio/dist` statically on **port 3333** (e.g. `python3 -m http.server 3333`, after stopping the dev server): project `ppsg7ml5` only allow-lists `http://localhost:3333`, so from any other port API requests fail CORS and the bifur `/socket/` WebSocket is rejected during its handshake (close code 1006 + retry loop). The static server has no SPA fallback, so load `http://localhost:3333/#token=…` (root path) and let the client-side router redirect, rather than deep-linking to a workspace path.

### Running e2e (Playwright) tests in the VM

The e2e suite runs against the staging project `ittbm412` (see `.env.example`) on `api.sanity.work`. `STUDIO_E2E_AUTH_TOKEN` is injected into the VM for exactly this: it is a `manage-datasets` robot token on that project, so specs run the way CI runs them, with no source edits. Do not reach for `STUDIO_AUTH_TOKEN` or `SANITY_TEST_STUDIO_AUTH_TOKEN` here — those are production tokens and get 401 "Session not found" against `api.sanity.work`.

1. **Build the packages.** `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH" && pnpm build`, then `git checkout packages/sanity/package.json` — the build rewrites its `inlinedDependencies`.

2. **Install the browsers** (not preinstalled): `pnpm --filter e2e exec playwright install chromium firefox`.

3. **Create a dataset.** Give every run its own, like CI does, and name it `cursor_ci_<random>` so the periodic cleanup can find it afterwards:

   ```bash
   export SANITY_E2E_PROJECT_ID=ittbm412
   export SANITY_E2E_SESSION_TOKEN=$STUDIO_E2E_AUTH_TOKEN
   export SANITY_E2E_DATASET=cursor_ci_$(openssl rand -hex 3)
   pnpm e2e:setup # creates $SANITY_E2E_DATASET (public ACL) unless it already exists
   ```

4. **Start the studio** with those variables still exported. It serves on port 3339, which `playwright.config.ts` reuses instead of starting its own server:

   ```bash
   pnpm --filter studio-e2e-testing dev
   ```

   `sanity dev` needs no token of its own: Playwright authenticates the browser by seeding `SANITY_E2E_SESSION_TOKEN` into local storage through `storageState`.

5. **Run specs**, again with those variables exported:

   ```bash
   cd e2e && pnpm exec playwright test --project=chromium tests/navbar/search.spec.ts --retries=0
   ```

   Keep `--retries=0` so a flake stays visible, and add `--repeat-each=N` when chasing one. `--project=firefox` runs the other browser CI uses. CI gives each browser its own dataset through `SANITY_E2E_DATASET_CHROMIUM` / `SANITY_E2E_DATASET_FIREFOX`; both fall back to `SANITY_E2E_DATASET`, so run one project at a time unless you create a dataset per browser — specs that touch per-user state (key-value keys such as recent searches or sort orders) otherwise interfere across browsers.

6. **Delete the dataset when you are done:**

   ```bash
   curl -X DELETE "https://$SANITY_E2E_PROJECT_ID.api.sanity.work/v2023-02-03/datasets/$SANITY_E2E_DATASET" \
     -H "Authorization: Bearer $STUDIO_E2E_AUTH_TOKEN"
   ```

   `pnpm e2e:cleanup`, scheduled every 6 hours, sweeps `cursor_ci_*` datasets older than 24 hours as a backstop — treat that as a safety net, not as the cleanup step.

Debugging notes:

- A fresh dataset is empty. Specs that need content seed it themselves; if one assumes documents exist, that is a bug in the spec, not a reason to point at the shared `staging` dataset.
- The failure video is written to `e2e/results/<test>/video.webm`; extract frames with the bundled ffmpeg: `~/.cache/ms-playwright/ffmpeg-*/ffmpeg-linux -i video.webm -r 1 /tmp/frame_%03d.png` (this build has no `-vf fps=` filter).
- CI e2e failures publish a plain-markdown digest at `<report-url>/agent-report.md` (same Vercel deployment as the HTML report). Fetch that URL instead of the HTML report — it includes the error, code snippet, `error-context` page snapshot, and a local repro command. The PR comment's **Share with an AI agent** fenced prompt is the paste-ready prompt (one-click copy).
- To reproduce load-related flakiness, throttle the browser from within the spec: `const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', {rate: 8})` (chromium only). Stub a slow or eventually-consistent backend with `page.route('**/data/query/**', …)`; the global search query is identifiable by its `findability-source: global` GROQ comment.
