# AGENTS.md - AI Agent Guidelines for Sanity Monorepo

This document helps AI agents work successfully with the Sanity monorepo.

## Prerequisites

- **Node.js**: v24 or latest LTS
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

# Fix all lint issues (MUST pass CI)
pnpm lint:fix

# Run tests
pnpm test

# Update snapshots if tests fail due to expected changes
pnpm test -- -u

# Type check
pnpm check:types
```

## CI Checks - What Must Pass

These checks run on every PR and **must pass**:

| Check            | Command               | Notes                                                                                                                                                            |
| ---------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Format**       | `pnpm check:format`   | Uses oxfmt. Fix with `pnpm chore:format:fix`                                                                                                                     |
| **Oxlint**       | `pnpm check:oxlint`   | Rust linter (type-aware via tsgolint) plus ESLint plugins loaded as oxlint jsPlugins. Fix with `pnpm chore:oxlint:fix`                                           |
| **Type Check**   | `pnpm check:types`    | TypeScript via tsgo + turbo                                                                                                                                      |
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
│   └── test-studio/      # Primary dev studio (pnpm dev runs this)
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
pnpm dev  # Starts at http://localhost:3333
```

- **Requires browser authentication** on first visit—you'll be prompted to log in with a Sanity account
- Connects to a real Sanity project (configured in `dev/test-studio/sanity.config.ts`)
- Uses staging API by default (`api.sanity.work`)
- Session persists in browser, so subsequent visits won't require re-authentication

Use the dev studio when you need to:

- Visually verify UI changes
- Test real document editing workflows
- Debug issues that only appear with real data

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

See `perf/bench/README.md` for A/B comparisons, scenarios, and CI details. `dev/efps` is the legacy perf suite, kept for reference while perf/bench burns in.

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

### Important Note for AI Agents

**What requires authentication:**

- Running the dev studio (`pnpm dev`)
- E2E tests (`pnpm test:e2e`)
- Any command that connects to Sanity APIs

**What does NOT require authentication:**

- Building packages (`pnpm build`)
- Running unit tests (`pnpm test`)
- Linting and formatting (`pnpm lint`, `pnpm lint:fix`)
- Type checking (`pnpm check:types`)

**Recommendation:** For most code changes, use `pnpm build && pnpm test` to verify correctness. This covers the vast majority of development tasks without any auth setup. Only use the dev studio when visual verification is specifically needed.

## Coding Standards

Coding standards are enforced by **oxlint** (native Rust rules, type-aware rules via tsgolint, and a few ESLint plugins loaded through oxlint's `jsPlugins`). Check your code with:

```bash
pnpm lint              # Check for issues (oxlint)
pnpm lint:fix          # Auto-fix issues (oxfmt + oxlint --fix)
```

All packages use **ESM** (`"type": "module"`). TypeScript strict mode is enabled.

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

### E2E Tests (Playwright)

```bash
pnpm e2e:build              # Build E2E studio
pnpm test:e2e               # Run E2E tests
pnpm test:e2e --ui          # Interactive mode
```

## Pre-commit Hook

Lefthook runs on commit (see `lefthook.yml`), which:

1. Runs oxfmt on staged files
2. Runs oxlint `--fix` on staged `.js/.ts/.tsx` files

If the hook fails, run `pnpm lint:fix` to fix issues.

## Common Tasks

### Adding a New Dependency

```bash
# Add to specific package
pnpm --filter sanity add <package>

# Add to root (dev dependency)
pnpm add -w -D <package>
```

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

**Always create PRs as drafts first.**

```bash
# Create a draft PR — title MUST follow conventional commit format
gh pr create --draft --title "fix(scope): description" --body "..."
```

Workflow:

1. **Agent creates draft PR** - Push changes and open as draft
2. **Prompter reviews** - The person who requested the changes reviews the draft
3. **Mark ready for review** - Once the prompter approves, mark PR as ready: `gh pr ready`
4. **Team reviews** - Team members review and approve

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

See `turbo.json` for full list of environment variables that affect builds.

## Useful Links

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Full contribution guidelines
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) - Community guidelines
- [packages/sanity/README.md](./packages/sanity/README.md) - Main package docs

## Cursor Cloud specific instructions

These notes cover non-obvious gotchas for running in the Cursor Cloud VM. The startup update script already runs `pnpm install`.

- **`pnpm test` needs `tsc` at the repo root, but the repo only uses `tsgo`.** Vitest is configured with `typecheck.enabled: true` (see `vitest.config.mts` and `packages/sanity/vitest.config.mts`), which spawns the real `tsc` binary for `*.test-d.*` type tests (in the `sanity` and `@sanity/types` projects). The repo intentionally depends on `@typescript/native-preview` (`tsgo`) and does not declare `typescript` directly, so pnpm only hoists `typescript` into the virtual store (`node_modules/.pnpm/node_modules/typescript`) and never creates a root `node_modules/.bin/tsc`. Without `tsc` on the path, `pnpm test` still passes every test but exits non-zero with `Spawning typechecker failed - is typescript installed?`. The startup update script fixes this by symlinking the hoisted `typescript` to the root (`node_modules/typescript` + `node_modules/.bin/tsc`). If you ever run a manual `pnpm install` that wipes these symlinks and then see that error, re-create them (or re-run the update script). Running a single project (e.g. `pnpm vitest run --project=sanity`) also triggers this.
- **Dev studio auth for cloud agents — use the `STUDIO_AUTH_TOKEN` secret, not interactive login.** `pnpm dev` runs `sanity dev --no-auto-updates` (non-interactive, no upgrade prompt) and serves the app at `http://localhost:3333`. The test studio connects to Sanity Cloud (project `ppsg7ml5`); its default workspace is `/test`. Without auth the workspaces show "Signed out" / "Choose login provider". To authenticate, put the injected `STUDIO_AUTH_TOKEN` in the URL hash — Sanity consumes it on load and strips it from the address bar:
  - Build the URL: `node -e "console.log('http://localhost:3333/test#token=' + encodeURIComponent(process.env.STUDIO_AUTH_TOKEN))"` (any workspace basePath works, e.g. `/test`).
  - Because the Read tool redacts the token, you cannot paste the URL into browser instructions directly. A reliable trick is a tiny local HTTP server that reads `STUDIO_AUTH_TOKEN` from env and serves an HTML page doing `location.replace(<studio-url-with-token>)`, then point the browser at that server (keeps the secret out of prompts/screenshots). After load you land authenticated in the workspace and can create/publish documents (e.g. an `Author`).
  - Most changes should still be verified with `pnpm build && pnpm test` (no auth needed); only use the studio for visual/manual verification.
- **Seeding test documents for the `/test` workspace via API.** In local dev (non-staging), the `/test` workspace talks to the production API host, so `STUDIO_AUTH_TOKEN` works as a Bearer token against `https://ppsg7ml5.api.sanity.io/v2024-01-01/data/mutate/test` (it returns 401 "Session not found" on `api.sanity.work`). Caveat when testing history/review-changes features: documents created by raw API mutations (e.g. `createOrReplace` of a published id) do not produce publish events, so the Review changes inspector shows "There are no changes" / "Same revision selected". Instead, create only the draft (`drafts.<id>`) via the API, click Publish in the studio UI to create a real publish event, then edit fields in the form to create draft changes.
- **Node version:** the VM runs Node 22.x, which satisfies the repo engine range (`>=22.12`). A couple of internal tooling packages print a harmless `Unsupported engine` warning wanting Node `>=22.18`; it does not affect building, testing, or running the studio.
