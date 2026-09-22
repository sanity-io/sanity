# Detailed Differences: tsdown vs tsup

Comprehensive comparison of tsdown and tsup for understanding migration impact and new capabilities.

## Architecture

| Aspect                   | tsup            | tsdown                                                   |
| ------------------------ | --------------- | -------------------------------------------------------- |
| Core bundler             | esbuild (Go)    | Rolldown (Rust)                                          |
| Plugin system            | esbuild plugins | Rolldown + Rollup + Unplugin plugins                     |
| Type declarations        | Single pass     | Dual-format with separate CJS dts pass                   |
| Package.json integration | Basic           | Advanced (auto-exports, validation)                      |
| Watch mode               | Standard        | Enhanced with keyboard shortcuts (`r` rebuild, `q` quit) |
| Module system            | CJS-first       | ESM-first                                                |

## Default Value Comparison

| Option   | tsup     | tsdown                                    | Impact                                                  |
| -------- | -------- | ----------------------------------------- | ------------------------------------------------------- |
| `format` | `'cjs'`  | `'esm'`                                   | Output format changes — set explicitly during migration |
| `clean`  | `false`  | `true`                                    | Output dir cleaned before build — may surprise users    |
| `dts`    | `false`  | Auto if `types`/`typings` in package.json | Types generated automatically — usually desired         |
| `target` | _(none)_ | Reads `engines.node` from package.json    | Compilation target auto-detected — usually desired      |

### Dependency Handling Defaults (tsdown v0.23+)

- `dependencies`, `peerDependencies`, and `optionalDependencies` are all externalized by default. tsup only externalizes `dependencies` and `peerDependencies`, so `optionalDependencies` may switch from bundled to external after migration.
- Other imports resolved from `node_modules` are bundled with a warning, unless whitelisted via `deps.onlyBundle`.
- `deps.resolveDepSubpath` (resolving subpath imports of externalized packages without an `exports` field) is disabled by default.

## Feature Compatibility

### Fully Supported (works the same)

- Multiple entry points (array, object, globs)
- Multiple formats (ESM, CJS, IIFE, UMD)
- TypeScript declarations (`dts`)
- Source maps
- Minification
- Watch mode
- Tree shaking
- Shims (`__dirname`, `__filename`, `require`)
- Clean output directory
- Define (global constants)
- Banner/footer injection
- `onSuccess` callback

### Supported with Changes (Renamed)

| Feature           | tsup                    | tsdown                   | Change                             |
| ----------------- | ----------------------- | ------------------------ | ---------------------------------- |
| Entry points      | `entryPoints`           | `entry`                  | Also deprecated in tsup itself     |
| CJS interop       | `cjsInterop`            | `cjsDefault`             | Property rename                    |
| Plugins           | `esbuildPlugins`        | `plugins`                | Different plugin format (Rolldown) |
| Output extensions | `outExtension`          | `outExtensions`          | Property rename                    |
| Copy files        | `publicDir`             | `copy`                   | Property rename                    |
| Bundleless        | `bundle: false`         | `unbundle: true`         | Inverted logic                     |
| Strip node:       | `removeNodeProtocol`    | `nodeProtocol: 'strip'`  | New option with more modes         |
| CSS inject        | `injectStyle`           | `css: { inject: true }`  | Moved to css namespace             |
| Skip node_modules | `skipNodeModulesBundle` | `deps.neverBundle: true` | Externalize all dependencies       |

None of the old names in this table are recognized by tsdown v0.23+. The compatibility options (`outExtension`, `skipNodeModulesBundle`, `publicDir`, `bundle`, `removeNodeProtocol`, `injectStyle`) were accepted with deprecation warnings up to v0.22.14 and removed entirely in v0.23 — on v0.23+ leftovers are silently ignored at runtime. Always emit the tsdown names, and migrate in two stages (build on `tsdown@0.22.14` until zero deprecation warnings remain, then upgrade to `^0.23.0`+ — see SKILL.md).

### Deprecated but Still Accepted

`external` and `noExternal` are the only tsup option names tsdown v0.23 still accepts. They emit deprecation warnings, will be removed in a future version, and cannot be combined with their replacements (mixing them throws an error) — migrate immediately.

| Feature       | tsup (deprecated) | tsdown (preferred)  | Change                  |
| ------------- | ----------------- | ------------------- | ----------------------- |
| External deps | `external`        | `deps.neverBundle`  | Moved to deps namespace |
| Inline deps   | `noExternal`      | `deps.alwaysBundle` | Moved to deps namespace |

### Output Filename Differences

For IIFE builds, `tsdown` emits `[name].iife.js`; `tsup` commonly emitted `[name].global.js`. `outExtensions` customizes extensions or suffixes, but it does not remove `.iife` or `.umd`. Use `outputOptions.entryFileNames` for full filename patterns.

### Not Supported

| Feature              | Reason                        | Alternative                          |
| -------------------- | ----------------------------- | ------------------------------------ |
| `splitting: false`   | Code splitting always enabled | None — splitting cannot be disabled  |
| `metafile`           | Not implemented               | `devtools: true` for bundle analysis |
| `swc`                | Uses oxc instead              | Built-in, no config needed           |
| `experimentalDts`    | Superseded                    | Use `dts` option                     |
| `legacyOutput`       | Not implemented               | None                                 |
| `plugins` (tsup API) | Different plugin architecture | Rewrite as Rolldown/Unplugin plugins |

## New Features in tsdown

### Node Protocol Control

```ts
nodeProtocol: true // Add node: prefix (fs → node:fs)
nodeProtocol: 'strip' // Remove node: prefix (node:fs → fs)
nodeProtocol: false // Keep as-is (default)
```

### Workspace / Monorepo

```ts
export default defineConfig({
  workspace: 'packages/*',
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
})
```

### Auto Package Exports

```ts
export default defineConfig({
  exports: true, // Generate package.json exports field
})
```

### Package Validation

```ts
export default defineConfig({
  publint: true, // Lint package for common issues
  attw: true, // Check "are the types wrong"
})
```

### Standalone Executable

```ts
export default defineConfig({
  entry: ['src/cli.ts'],
  exe: true, // Bundle as Node.js SEA
})
```

### Vite DevTools

```ts
export default defineConfig({
  devtools: true, // Vite DevTools bundle analysis
})
```

### Lifecycle Hooks

```ts
export default defineConfig({
  hooks: {
    'build:prepare': async (ctx) => {
      /* before any build */
    },
    'build:before': async (ctx) => {
      /* before each format */
    },
    'build:done': async (ctx) => {
      /* after build, access chunks */
    },
  },
})
```

### CSS Modules

```ts
export default defineConfig({
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
})
```

### Glob Import

```ts
export default defineConfig({
  globImport: true, // Support import.meta.glob (Vite-style)
})
```

## Related

- [guide-option-mappings.md](guide-option-mappings.md) - Before/after for every option
- [guide-package-json.md](guide-package-json.md) - Package.json migration
