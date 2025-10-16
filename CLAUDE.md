# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the Sanity monorepo containing Sanity Studio, the Sanity CLI, and related packages. Sanity is a real-time content infrastructure with a headless CMS and studio for content editing.

## Package Manager

This project uses **pnpm** (version 10.17.1+) as the package manager. Always use `pnpm` instead of npm or yarn.

## Common Commands

### Initial Setup

```bash
pnpm install          # Install dependencies
pnpm build           # Build all packages
pnpm dev             # Start dev mode (runs dev:test-studio)
```

### Building

```bash
pnpm build                    # Build all packages in packages/*
pnpm build:cli                # Build only CLI packages (@sanity/cli and sanity)
pnpm build --filter=<package> # Build specific package
```

### Testing

```bash
pnpm test                # Run vitest tests across all packages
pnpm test:vitest:watch   # Run tests in watch mode
pnpm test:e2e            # Run Playwright E2E tests
pnpm coverage            # Generate test coverage report
```

### Test a single package

```bash
cd packages/sanity && pnpm test              # Run tests for specific package
cd packages/sanity && pnpm test:ct          # Run component tests (Playwright)
```

### Linting and Formatting

```bash
pnpm lint                 # Run oxlint and eslint across packages
pnpm lint:fix             # Auto-fix linting issues (format, oxlint, eslint)
pnpm check:format         # Check formatting with prettier
pnpm chore:format:fix     # Auto-fix formatting
```

### Type Checking

```bash
pnpm check:types          # Run TypeScript type checking across all packages
```

### Development Studios

```bash
pnpm dev:test-studio      # Main test studio (default dev command)
pnpm dev:design-studio    # Design system studio
pnpm dev:strict-studio    # Studio with strict mode enabled
```

### E2E Testing

```bash
pnpm e2e:dev              # Start E2E test studio in dev mode
pnpm e2e:build            # Build E2E test studio
pnpm test:e2e             # Run Playwright E2E tests
```

## Monorepo Structure

This is a **pnpm workspace monorepo** managed with **Turbo** and **Lerna**.

### Key Directories

- **`packages/sanity/`** - Main Sanity Studio package (published as `sanity` on npm)
- **`packages/@sanity/`** - Core Sanity packages (cli, schema, types, mutator, diff, etc.)
- **`packages/@repo/`** - Internal monorepo tooling (not published)
- **`packages/groq/`** - GROQ query language implementation
- **`packages/create-sanity/`** - Studio project scaffolding tool
- **`dev/`** - Development studios for testing
- **`examples/`** - Example studio projects
- **`test/e2e/`** - End-to-end tests using Playwright
- **`perf/`** - Performance testing suite
- **`scripts/`** - Build and maintenance scripts

### Main Package Architecture (`packages/sanity/`)

The sanity package has multiple export entry points defined in package.json:

- **`sanity`** - Main export (core studio APIs)
- **`sanity/desk`** - Desk tool (document editing workspace)
- **`sanity/structure`** - Structure builder APIs
- **`sanity/presentation`** - Presentation tool
- **`sanity/router`** - Routing utilities
- **`sanity/cli`** - CLI utilities
- **`sanity/migrate`** - Migration utilities
- **`sanity/_internal`** - Internal APIs (unstable)
- **`sanity/_singletons`** - Singleton exports for React context
- **`sanity/_createContext`** - Context creation utilities

Source structure:

- **`src/core/`** - Core studio functionality (config, hooks, store, form, validation, etc.)
- **`src/desk/`** - Desk tool implementation
- **`src/structure/`** - Structure builder
- **`src/presentation/`** - Presentation tool
- **`src/router/`** - Router implementation
- **`src/ui-components/`** - Shared UI components
- **`src/_exports/`** - Entry point files for each export

## Build System

- **Turbo**: Task orchestration and caching
- **@sanity/pkg-utils**: Package building (wraps esbuild/rollup)
- **Vite**: Used for bundling and dev server in studios
- **esbuild**: Fast TypeScript/JavaScript compilation
- **TypeScript**: Type checking (version 5.9.2)

Build outputs:

- `lib/` - Compiled JavaScript (both ESM `.mjs` and CJS `.js`)
- `dist/` - Bundled assets (for some packages)

## Testing

- **Vitest**: Unit and integration tests (configured in `vitest.config.mts`)
- **Playwright**: E2E tests for studio functionality
- **@playwright/experimental-ct-react**: Component testing

Coverage is collected from `packages/**/src/**` excluding workshop files, telemetry, and CLI.

## Code Quality Tools

- **ESLint**: Configured via `eslint.config.mjs` (flat config)
- **oxlint**: Fast linter (configured in `.oxlintrc.json`)
- **Prettier**: Code formatting (config from `@sanity/prettier-config`)
- **lint-staged**: Pre-commit hooks managed by Husky

## Important Configuration Files

- **`pnpm-workspace.yaml`** - Workspace configuration and catalog dependencies
- **`turbo.json`** - Turbo build pipeline configuration
- **`lerna.json`** - Lerna release configuration
- **`vitest.config.mts`** - Test configuration
- **`playwright.config.ts`** - E2E test configuration
- **`tsconfig.json`** - Root TypeScript configuration
- **`.npmrc`** - pnpm configuration (note: public-hoist-pattern for prettier/eslint)

## Workflow Notes

### Making Changes

1. Create a feature branch off `main`
2. Make changes and commit regularly
3. Run `pnpm build` to compile packages
4. Run `pnpm lint` and `pnpm test` before committing
5. Open a PR targeting `main`

### Working with Dependencies

- Use **catalog** dependencies when possible (defined in `pnpm-workspace.yaml`)
- Run `pnpm install` to update dependencies
- The monorepo uses workspace protocol (`workspace:*`) for internal dependencies

### Building Individual Packages

Each package can be built independently:

```bash
cd packages/sanity
pnpm build
```

Or use turbo filters from root:

```bash
pnpm build --filter=sanity
```

### Troubleshooting

If you encounter build issues:

```bash
pnpm clean              # Clean build artifacts
pnpm clean:deps         # Remove all node_modules
pnpm install            # Reinstall dependencies
pnpm build              # Rebuild everything
```

## Branch Strategy

- **`main`** - Development branch, always ready to release
- **`current`** - Points to last released version
- **`stable`** - Releases on stable tag (typically Tuesdays)

## Release Process

Releases are managed with Lerna:

```bash
pnpm release           # Standard release
pnpm release:canary    # Canary release
pnpm release:rc        # Release candidate
```
