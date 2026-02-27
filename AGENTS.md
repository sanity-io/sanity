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

| Check            | Command              | Notes                                                    |
| ---------------- | -------------------- | -------------------------------------------------------- |
| **Format**       | `pnpm check:format`  | Uses Prettier. Fix with `pnpm chore:format:fix`          |
| **Oxlint**       | `pnpm check:oxlint`  | Fast Rust-based linter. Fix with `pnpm chore:oxlint:fix` |
| **ESLint**       | `pnpm lint`          | Full linting. Fix with `pnpm chore:lint:fix`             |
| **Type Check**   | `pnpm check:types`   | TypeScript via tsgo + turbo                              |
| **Unit Tests**   | `pnpm test`          | Vitest, sharded in CI                                    |
| **CLI Tests**    | Runs via `pnpm test` | Tests for @sanity/cli                                    |
| **Export Tests** | `pnpm test:exports`  | Ensures ESM/CJS/DTS work                                 |
| **Dep Check**    | `pnpm depcheck`      | Finds unused/missing deps                                |
| **PR Title**     | Conventional commits | e.g., `feat(scope): description`                         |

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
│   └── @repo/            # Internal tooling (eslint-config, test-config, etc.)
├── dev/                  # Development studios for testing
│   └── test-studio/      # Primary dev studio (pnpm dev runs this)
├── e2e/                  # End-to-end Playwright tests
├── perf/                 # Performance testing
└── examples/             # Example studios
```

### Key Packages

- **`packages/sanity`** - Core studio package with all UI components
- **`packages/@sanity/cli`** - CLI tool (`sanity` command)
- **`packages/@sanity/types`** - TypeScript type definitions
- **`packages/@sanity/schema`** - Schema compilation
- **`packages/@sanity/mutator`** - Document mutation logic

## Build System

- **Package Manager**: pnpm (version 10.28.1, enforced via `preinstall`)
- **Build Orchestration**: Turbo (caches builds)
- **Versioning**: Lerna-lite with conventional commits

### Build Commands

```bash
pnpm build              # Build all packages
pnpm build:cli          # Build CLI only (faster)
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

# Run a specific test file
pnpm test -- packages/sanity/src/core/hooks/useClient.test.ts

# Watch mode for iterative development
pnpm test -- --watch

# Run tests for a specific package
pnpm test -- --project=sanity
```

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

Coding standards are enforced by **oxlint** and **eslint**. Check your code with:

```bash
pnpm lint              # Check for issues
pnpm lint:fix          # Auto-fix issues
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

Husky runs `lint-staged` on commit, which:

1. Runs Prettier on staged files
2. Runs oxlint on staged `.js/.ts/.tsx` files

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

## Commit Message Format

This repo uses **conventional commits** for automated releases:

```
type(scope): description

feat(form): add new array input component
fix(cli): handle missing config file gracefully
chore(deps): update dependencies
docs(readme): improve installation instructions
refactor(store): simplify document subscription logic
test(validation): add edge case coverage
```

**Types**: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`

PR titles must follow this format (validated by CI).

## Pull Request Workflow

**Always create PRs as drafts first.**

```bash
# Create a draft PR
gh pr create --draft --title "feat(scope): description" --body "..."
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
