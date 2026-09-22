---
name: tsdown-migrate
description: Migrate TypeScript library projects from tsup to tsdown. Provides complete option mappings, config transformation rules, default value differences, and unsupported option alternatives so AI agents can intelligently perform migrations.
---

# Migrating from tsup to tsdown

Knowledge base for AI agents to migrate tsup projects to tsdown — the Rolldown-powered library bundler.

## Target Version: Two-Stage Migration

tsdown v0.23 removed all previously-deprecated tsup compatibility options — `bundle`, `outExtension`, `publicDir`, `removeNodeProtocol`, `injectStyle`, and `skipNodeModulesBundle` are no longer recognized. They fail TypeScript type checking and are **silently ignored at runtime**, so a missed mapping on v0.23+ produces wrong output without any error. Migrating directly to v0.23+ is therefore unsafe. tsdown **v0.22.14** is the last version that still accepts these options and flags each one with a deprecation warning, making it the safe migration checkpoint. Migrate in **two stages**:

1. **Stage 1 — migrate on `tsdown@0.22.14`**: Install `tsdown@0.22.14`, migrate the config per the tables below, run a build, and resolve **every** deprecation warning by mapping each flagged tsup option to its real tsdown equivalent. The warnings are the completeness check — the migration is not done until the build produces **zero warnings**.
2. **Stage 2 — upgrade to the latest tsdown (`^0.23.0` or newer)**: Only after a warning-free build on 0.22.14. Since the config no longer uses any removed compat options, the silent-ignore behavior of v0.23+ is no longer a risk.

## Runtime Requirement

`tsdown` requires **Node.js `^22.18.0 || ^24.11.0 || >=26.0.0` to run** (build-time only) — that is, Node.js 22.18+, 24.11+, or 26+. Odd-numbered and EOL release lines (e.g. Node.js 23, 25) are not supported. The bundled output can still target lower Node.js versions via the [`target`](../tsdown/references/option-target.md) option, so a library that previously supported Node.js 18 / 20 with tsup can continue to do so after migrating.

Recommended workflow when supporting Node.js 18 / 20:

- **Build with Node.js 22+ in CI**, setting an explicit `target` such as `'node18'` or `'node20'`.
- **Test the built output (or the packed tarball) on the lower Node.js versions** you need to support.

## When to Use

- Migrating a project from tsup to tsdown
- Understanding differences between tsup and tsdown options
- Reviewing or fixing post-migration configuration issues
- Advising users on tsup→tsdown compatibility

## Migration Overview

Follow these steps to migrate a tsup project:

1. **Rename config file**: `tsup.config.*` → `tsdown.config.*`
2. **Update imports**: `'tsup'` → `'tsdown'`
3. **Apply option mappings**: Rename/transform options per tables below
4. **Preserve tsup defaults**: Explicitly set options that differ (format, clean, dts, target)
5. **Update package.json**: Dependencies (Stage 1: `tsdown@0.22.14`), scripts, root config field
6. **Remove unsupported options**: Replace with alternatives where available
7. **Test build on 0.22.14**: Run `tsdown` and resolve every deprecation warning — zero warnings required
8. **Upgrade to latest tsdown** (`^0.23.0` or newer) and verify the build again

## Config File Migration

### File Rename

| tsup               | tsdown               |
| ------------------ | -------------------- |
| `tsup.config.ts`   | `tsdown.config.ts`   |
| `tsup.config.cts`  | `tsdown.config.cts`  |
| `tsup.config.mts`  | `tsdown.config.mts`  |
| `tsup.config.js`   | `tsdown.config.js`   |
| `tsup.config.cjs`  | `tsdown.config.cjs`  |
| `tsup.config.mjs`  | `tsdown.config.mjs`  |
| `tsup.config.json` | `tsdown.config.json` |

### Import and Identifier Changes

```ts
// Before
import {defineConfig} from 'tsup'

// After
import {defineConfig} from 'tsdown'
```

Replace all identifiers: `tsup` → `tsdown`, `TSUP` → `TSDOWN`.

## Option Mappings

### Property Renames

| tsup                       | tsdown                        | Notes                              |
| -------------------------- | ----------------------------- | ---------------------------------- |
| `entryPoints`              | `entry`                       | Also deprecated in tsup itself     |
| `cjsInterop`               | `cjsDefault`                  | CJS default export handling        |
| `esbuildPlugins`           | `plugins`                     | Now uses Rolldown/Unplugin plugins |
| `outExtension`             | `outExtensions`               | Custom output extensions           |
| `publicDir`                | `copy`                        | Copy static files to output        |
| `bundle: true`             | _(remove)_                    | Bundle is default behavior         |
| `bundle: false`            | `unbundle: true`              | Preserve file structure            |
| `removeNodeProtocol: true` | `nodeProtocol: 'strip'`       | Strip `node:` prefix               |
| `injectStyle: true`        | `css: { inject: true }`       | CSS injection                      |
| `injectStyle: false`       | _(remove)_                    | Default behavior                   |
| `skipNodeModulesBundle`    | `deps: { neverBundle: true }` | Externalize all dependencies       |

None of the old names are recognized by tsdown v0.23+ — always emit the new names. The compatibility options (`outExtension`, `skipNodeModulesBundle`, `publicDir`, `bundle`, `removeNodeProtocol`, `injectStyle`) were accepted with deprecation warnings up to v0.22.14 and removed entirely in v0.23; on v0.23+ leftovers are silently ignored, not errors, so builds misbehave without warning. This is why Stage 1 runs on v0.22.14, where every leftover is flagged.

### Deprecated but Still Accepted

`external` and `noExternal` are the **only** tsup option names tsdown v0.23 still accepts. They emit deprecation warnings, will be removed in a future version, and cannot be combined with their replacements (mixing `external` with `deps.neverBundle`, or `noExternal` with `deps.alwaysBundle`, throws an error). Always emit the replacements.

| tsup (deprecated)   | tsdown (preferred)              | Notes                   |
| ------------------- | ------------------------------- | ----------------------- |
| `external: [...]`   | `deps: { neverBundle: [...] }`  | Moved to deps namespace |
| `noExternal: [...]` | `deps: { alwaysBundle: [...] }` | Moved to deps namespace |

### Output Filename Differences

For IIFE builds, `tsdown` emits names like `[name].iife.js`, while `tsup` commonly emitted `[name].global.js`. `outExtensions` customizes extensions or suffixes, but it does not remove the built-in `.iife` or `.umd` segment. Use `outputOptions.entryFileNames: '[name].global.js'` to preserve old IIFE filenames.

### Dependency Namespace Moves

Dependencies config moved under `deps` namespace. If both `external` and `noExternal` exist, merge into a single `deps` object:

```ts
// Before (tsup)
export default defineConfig({
  external: ['react'],
  noExternal: ['lodash-es'],
})

// After (tsdown)
export default defineConfig({
  deps: {
    neverBundle: ['react'],
    alwaysBundle: ['lodash-es'],
  },
})
```

tsdown also adds `deps.onlyBundle` (whitelist of allowed bundled packages) — no tsup equivalent.

Dependency handling defaults in tsdown v0.23+:

- `dependencies`, `peerDependencies`, and **`optionalDependencies`** are all externalized by default (tsup only externalizes `dependencies` and `peerDependencies`, so `optionalDependencies` may switch from bundled to external after migration).
- `deps.resolveDepSubpath` (resolving subpath imports of externalized packages without an `exports` field) is **disabled by default**.

### Plugin Import Transforms

```ts
// Before (tsup - esbuild plugins)
import plugin from 'unplugin-example/esbuild'

// After (tsdown - Rolldown plugins)
import plugin from 'unplugin-example/rolldown'
```

All `unplugin-*/esbuild` imports should change to `unplugin-*/rolldown`.

For complete before/after examples of every transformation, see [guide-option-mappings.md](references/guide-option-mappings.md).

## Default Value Differences

tsdown changes several defaults from tsup. When migrating, explicitly set these to preserve tsup behavior, then let the user decide which new defaults to adopt.

| Option   | tsup Default | tsdown Default                                    | Migration Action                |
| -------- | ------------ | ------------------------------------------------- | ------------------------------- |
| `format` | `'cjs'`      | `'esm'`                                           | Set `format: 'cjs'` to preserve |
| `clean`  | `false`      | `true`                                            | Set `clean: false` to preserve  |
| `dts`    | `false`      | Auto-enabled if `types`/`typings` in package.json | Set `dts: false` to preserve    |
| `target` | _(none)_     | Auto-reads from `engines.node` in package.json    | Set `target: false` to preserve |

After migration, suggest the user review these — tsdown's defaults are generally better:

- ESM is the modern standard
- Cleaning output prevents stale files
- Auto DTS from package.json reduces config
- Auto target from engines.node ensures consistency

## Unsupported Options

These tsup options have no direct equivalent in tsdown. Remove them and inform the user.

| tsup Option                   | Status         | Alternative                                                                     |
| ----------------------------- | -------------- | ------------------------------------------------------------------------------- |
| `splitting`                   | Always enabled | Remove — code splitting cannot be disabled in tsdown                            |
| `metafile`                    | Not available  | Suggest `devtools: true` for Vite DevTools bundle analysis                      |
| `swc`                         | Not supported  | Remove — tsdown uses oxc for transformation (built-in)                          |
| `experimentalDts`             | Not supported  | Use the `dts` option instead                                                    |
| `legacyOutput`                | Not supported  | Remove — no alternative                                                         |
| `plugins` (tsup experimental) | Incompatible   | Migrate to Rolldown plugins manually; tsup's plugin API differs from Rolldown's |

## Package.json Migration

### Scripts

Replace `tsup` and `tsup-node` with `tsdown` in all script commands:

```json
// Before
{
  "scripts": {
    "build": "tsup src/index.ts",
    "dev": "tsup --watch"
  }
}

// After
{
  "scripts": {
    "build": "tsdown src/index.ts",
    "dev": "tsdown --watch"
  }
}
```

### Dependencies

| Location                    | Action                                  |
| --------------------------- | --------------------------------------- |
| `dependencies.tsup`         | Rename to `dependencies.tsdown`         |
| `devDependencies.tsup`      | Rename to `devDependencies.tsdown`      |
| `optionalDependencies.tsup` | Rename to `optionalDependencies.tsdown` |
| `peerDependencies.tsup`     | Rename to `peerDependencies.tsdown`     |
| `peerDependenciesMeta.tsup` | Rename to `peerDependenciesMeta.tsdown` |

### Root Config Field

If package.json has a root-level `tsup` field (inline config), rename to `tsdown`:

```json
// Before
{ "tsup": { "entry": ["src/index.ts"] } }

// After
{ "tsdown": { "entry": ["src/index.ts"] } }
```

For detailed package.json examples, see [guide-package-json.md](references/guide-package-json.md).

## New tsdown Features

After migration, suggest these tsdown-exclusive features to the user:

| Feature            | Config                          | Description                                                    |
| ------------------ | ------------------------------- | -------------------------------------------------------------- |
| Node protocol      | `nodeProtocol: true \| 'strip'` | Add or strip `node:` prefix on built-in imports                |
| Workspace          | `workspace: 'packages/*'`       | Build multiple packages in a monorepo                          |
| Package exports    | `exports: true`                 | Auto-generate `exports` field in package.json                  |
| Package validation | `publint: true`, `attw: true`   | Lint package and check type correctness                        |
| Executable         | `exe: true`                     | Bundle as Node.js standalone executable (SEA)                  |
| DevTools           | `devtools: true`                | Vite DevTools integration for bundle analysis                  |
| Hooks              | `hooks: { 'build:done': ... }`  | Lifecycle hooks: `build:prepare`, `build:before`, `build:done` |
| CSS modules        | `css: { modules: { ... } }`     | Scoped class names for `.module.css` files                     |
| Glob import        | `globImport: true`              | Support `import.meta.glob` (Vite-style)                        |

For detailed comparisons, see [guide-differences-detailed.md](references/guide-differences-detailed.md).

## References

| Topic                | Description                                      | Reference                                                              |
| -------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| Option Mappings      | Complete before/after for every option transform | [guide-option-mappings](references/guide-option-mappings.md)           |
| Detailed Differences | Architecture, features, compatibility comparison | [guide-differences-detailed](references/guide-differences-detailed.md) |
| Package.json         | Dependency, script, and config field migration   | [guide-package-json](references/guide-package-json.md)                 |

## Migration Checklist

Use this checklist when performing a migration:

```
- [ ] Rename tsup.config.* → tsdown.config.*
- [ ] Update import from 'tsup' to 'tsdown'
- [ ] Replace tsup/TSUP identifiers with tsdown/TSDOWN
- [ ] Apply property renames (cjsInterop→cjsDefault, esbuildPlugins→plugins, outExtension→outExtensions, publicDir→copy, bundle→unbundle, removeNodeProtocol→nodeProtocol, injectStyle→css.inject)
- [ ] Move external/noExternal into deps namespace, replace skipNodeModulesBundle with `deps.neverBundle: true`
- [ ] Update unplugin imports from /esbuild to /rolldown
- [ ] Set explicit defaults to preserve tsup behavior (format, clean, dts, target)
- [ ] Remove unsupported options (splitting, metafile, swc, etc.)
- [ ] Update package.json scripts (tsup→tsdown)
- [ ] Update package.json dependencies (Stage 1: tsdown@0.22.14)
- [ ] Rename root-level tsup config field if present
- [ ] Run tsdown on 0.22.14 and resolve every deprecation warning (zero warnings required)
- [ ] Upgrade to the latest tsdown (^0.23.0 or newer) and verify the build again
- [ ] Suggest new tsdown features to the user
```
