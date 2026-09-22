# Migrate from tsup

Migration guide for switching from tsup to tsdown.

## Overview

tsdown is built on Rolldown (Rust-based) vs tsup's esbuild, providing faster and more powerful bundling while maintaining compatibility.

## Automatic Migration

### Single Package

```bash
npx tsdown-migrate
```

### Monorepo

```bash
# Using glob patterns
npx tsdown-migrate packages/*

# Multiple directories
npx tsdown-migrate packages/foo packages/bar
```

### Migration Options

- `[...dirs]` - Directories to migrate (supports globs)
- `--dry-run` or `-d` - Preview changes without modifying files
- `--yes` or `-y` - Skip confirmation (required in non-interactive environments)
- `--package-manager <name>` - Override package manager auto-detection
- `--no-install` - Skip dependency installation

For non-interactive callers that install dependencies separately:

```bash
npx tsdown-migrate --yes --no-install
```

When installation is enabled, the tool detects the package manager from the
project's `packageManager` field or lockfile. If detection fails without a TTY,
pass `--package-manager <name>` or `--no-install`.

**Important:** Commit your changes before running migration.

## Key Differences

### Default Values

| Option   | tsup      | tsdown                                            |
| -------- | --------- | ------------------------------------------------- |
| `format` | `['cjs']` | `['esm']`                                         |
| `clean`  | `false`   | `true`                                            |
| `dts`    | `false`   | Auto-enabled if `types`/`typings` in package.json |
| `target` | Manual    | Auto-read from `engines.node` in package.json     |

### Option Renames

| tsup                       | tsdown                        |
| -------------------------- | ----------------------------- |
| `entryPoints`              | `entry`                       |
| `cjsInterop`               | `cjsDefault`                  |
| `esbuildPlugins`           | `plugins`                     |
| `outExtension`             | `outExtensions`               |
| `skipNodeModulesBundle`    | `deps: { neverBundle: true }` |
| `publicDir`                | `copy`                        |
| `bundle: false`            | `unbundle: true`              |
| `removeNodeProtocol: true` | `nodeProtocol: 'strip'`       |
| `injectStyle: true`        | `css: { inject: true }`       |

The old names were accepted (with deprecation warnings) up to tsdown v0.22.14 and have been removed since — v0.23+ silently ignores them, so a leftover tsup option won't error. Migrate in two stages: install `tsdown@0.22.14` first and resolve every deprecation warning (a warning-free build proves the mapping is complete), then upgrade to the latest version. The `tsdown-migrate` tool installs v0.22.14 for this reason.

### Deprecated but Compatible Options

These tsup options still work but emit deprecation warnings and will be removed in a future version — migrate them immediately:

| tsup (deprecated)   | tsdown (preferred)              |
| ------------------- | ------------------------------- |
| `external: [...]`   | `deps: { neverBundle: [...] }`  |
| `noExternal: [...]` | `deps: { alwaysBundle: [...] }` |

tsdown also adds `deps.onlyBundle` for whitelisting allowed bundled packages.

### Unsupported Options

| Option                        | Status         | Alternative                                                |
| ----------------------------- | -------------- | ---------------------------------------------------------- |
| `splitting: false`            | Always enabled | Code splitting cannot be disabled                          |
| `metafile`                    | Not available  | Use `devtools: true` for bundle analysis via Vite DevTools |
| `swc`                         | Not supported  | tsdown uses oxc for transformation (built-in)              |
| `experimentalDts`             | Superseded     | Use the `dts` option instead                               |
| `legacyOutput`                | Not supported  | No alternative                                             |
| `plugins` (tsup experimental) | Incompatible   | Migrate to Rolldown plugins                                |

### Plugin System

tsdown uses Rolldown plugins instead of esbuild plugins. If you use unplugin plugins, update the import path:

```ts
// Before (tsup)
import plugin from 'unplugin-example/esbuild'
// After (tsdown)
import plugin from 'unplugin-example/rolldown'
```

### Output Filename Differences

For IIFE builds, `tsdown` emits `[name].iife.js`; `tsup` commonly emitted `[name].global.js`. `outExtensions` customizes extensions or suffixes, but it does not remove `.iife` or `.umd`. Use `outputOptions.entryFileNames: '[name].global.js'` to preserve old IIFE filenames.

### New Features in tsdown

#### Node Protocol Control

```ts
export default defineConfig({
  nodeProtocol: true, // Add node: prefix (fs → node:fs)
  nodeProtocol: 'strip', // Remove node: prefix (node:fs → fs)
  nodeProtocol: false, // Keep as-is (default)
})
```

#### Better Workspace Support

```ts
export default defineConfig({
  workspace: 'packages/*', // Build all packages
})
```

#### Other tsdown-Exclusive Features

- **`exports`**: Auto-generate the `exports` field in `package.json` with `exports: true`
- **`publint`** / **`attw`**: Validate your package for common issues and type correctness
- **`exe`**: Bundle as a Node.js standalone executable (SEA) with `exe: true`
- **`devtools`**: Vite DevTools integration for bundle analysis with `devtools: true`
- **`hooks`**: Lifecycle hooks (`build:prepare`, `build:before`, `build:done`)
- **`css`**: Full CSS pipeline with preprocessors, Lightning CSS, PostCSS, CSS modules, and code splitting
- **`globImport`**: Support for `import.meta.glob` (Vite-style glob imports)

## Migration Checklist

1. **Backup your code** - Commit all changes
2. **Run migration tool** - `npx tsdown-migrate`
3. **Review changes** - Check modified config files
4. **Update scripts** - Change `tsup` to `tsdown` in package.json
5. **Test build** - Run `pnpm build` to verify
6. **Adjust config** - Fine-tune based on your needs

## Common Migration Patterns

### Basic Library

**Before (tsup):**

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
})
```

**After (tsdown):**

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'], // ESM now default
  dts: true,
  clean: true, // Now enabled by default
})
```

### With Custom Target

**Before (tsup):**

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  target: 'es2020',
})
```

**After (tsdown):**

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  // target auto-reads from package.json engines.node
  // Or override explicitly:
  target: 'es2020',
})
```

### CLI Scripts

**Before (package.json):**

```json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch"
  }
}
```

**After (package.json):**

```json
{
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch"
  }
}
```

## Feature Compatibility

### Supported tsup Features

Most tsup features are supported:

- ✅ Multiple entry points
- ✅ Multiple formats (ESM, CJS, IIFE, UMD)
- ✅ TypeScript declarations
- ✅ Source maps
- ✅ Minification
- ✅ Watch mode
- ✅ External dependencies
- ✅ Tree shaking
- ✅ Shims
- ✅ Plugins (Rollup compatible)

### Missing Features

Some tsup features are not yet available. Check [GitHub issues](https://github.com/rolldown/tsdown/issues) for status and request features.

## Troubleshooting

### Build Fails After Migration

1. **Check Node.js version** - Requires Node.js 22.18.0+ to run tsdown itself. The bundled output can still target lower Node.js versions via `target`; if you need to support Node.js 18 / 20, build with Node.js 22+ in CI and test the produced output (or packed tarball) on the lower versions.
2. **Install TypeScript** - Required for DTS generation
3. **Review config changes** - Ensure format and options are correct
4. **Check dependencies** - Verify all dependencies are installed

### Different Output

- **Format order** - tsdown defaults to ESM first
- **Clean behavior** - tsdown cleans outDir by default
- **Target** - tsdown auto-detects from package.json

### Performance Issues

tsdown should be faster than tsup. If not:

1. Enable `isolatedDeclarations` for faster DTS generation
2. Check for large dependencies being bundled
3. Use `deps.neverBundle: true` if needed

## Getting Help

- [GitHub Issues](https://github.com/rolldown/tsdown/issues) - Report bugs or request features
- [Documentation](https://tsdown.dev) - Full documentation
- [Migration Tool](https://github.com/rolldown/tsdown/tree/main/packages/migrate) - Source code

## Acknowledgements

tsdown is heavily inspired by tsup and incorporates parts of its codebase. Thanks to [@egoist](https://github.com/egoist) and the tsup community.
