# Option Mappings: tsup → tsdown

Complete before/after reference for every config option transformation.

## Property Renames

### cjsInterop → cjsDefault

```ts
// Before (tsup)
export default defineConfig({
  cjsInterop: true,
})

// After (tsdown)
export default defineConfig({
  cjsDefault: true,
})
```

### esbuildPlugins → plugins

```ts
// Before (tsup)
import myPlugin from 'unplugin-example/esbuild'

export default defineConfig({
  esbuildPlugins: [myPlugin()],
})

// After (tsdown)
import myPlugin from 'unplugin-example/rolldown'

export default defineConfig({
  plugins: [myPlugin()],
})
```

Note: All `unplugin-*/esbuild` imports must change to `unplugin-*/rolldown`.

### outExtension → outExtensions

```ts
// Before (tsup)
export default defineConfig({
  outExtension: ({format}) => ({js: format === 'cjs' ? '.cjs' : '.mjs'}),
})

// After (tsdown)
export default defineConfig({
  outExtensions: ({format}) => ({js: format === 'cjs' ? '.cjs' : '.mjs'}),
})
```

The callback shape is compatible for the `js` key; tsdown's version can additionally return a `dts` extension.

## Removed Compatibility Options

tsdown v0.23 removed these previously-deprecated tsup compatibility options entirely. They are no longer recognized — TypeScript reports them as unknown properties and they are **silently ignored at runtime**, so leftovers make builds misbehave without any error. Always replace them with the tsdown equivalents, and verify on `tsdown@0.22.14` (the last version that flags each of them with a deprecation warning): a zero-warning build confirms the mapping is complete before upgrading to v0.23+ (see SKILL.md's two-stage flow).

### entryPoints → entry

`entryPoints` is also deprecated in tsup itself. Both tsup and tsdown use `entry`.

```ts
// Before (tsup)
export default defineConfig({
  entryPoints: ['src/index.ts', 'src/cli.ts'],
})

// After (tsdown)
export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
})
```

### publicDir → copy

```ts
// Before (tsup)
export default defineConfig({
  publicDir: 'public',
})

// After (tsdown)
export default defineConfig({
  copy: 'public',
})
```

### bundle → unbundle

```ts
// Before (tsup) — bundle: true is default, just remove
export default defineConfig({
  bundle: true,
})

// After (tsdown) — remove entirely
export default defineConfig({})
```

```ts
// Before (tsup) — bundle: false
export default defineConfig({
  bundle: false,
})

// After (tsdown)
export default defineConfig({
  unbundle: true,
})
```

### removeNodeProtocol → nodeProtocol

```ts
// Before (tsup)
export default defineConfig({
  removeNodeProtocol: true,
})

// After (tsdown)
export default defineConfig({
  nodeProtocol: 'strip',
})
```

### injectStyle → css.inject

```ts
// Before (tsup)
export default defineConfig({
  injectStyle: true,
})

// After (tsdown)
export default defineConfig({
  css: {inject: true},
})
```

`injectStyle: false` should be removed (it's the default).

### skipNodeModulesBundle → deps.neverBundle

```ts
// Before (tsup)
export default defineConfig({
  skipNodeModulesBundle: true,
})

// After (tsdown)
export default defineConfig({
  deps: {neverBundle: true},
})
```

`deps.neverBundle: true` externalizes **all** dependencies; use `deps.alwaysBundle` to opt specific imports back into the bundle.

## Deprecated but Still Accepted

`external` and `noExternal` are the only tsup option names tsdown v0.23 still accepts. They emit deprecation warnings and will be removed in a future version — always emit the replacements. Combining the old and new forms (e.g. `external` together with `deps.neverBundle`) throws an error.

### external → deps.neverBundle

```ts
// Before (tsup)
export default defineConfig({
  external: ['react', 'react-dom', /^@myorg\//],
})

// After (tsdown)
export default defineConfig({
  deps: {
    neverBundle: ['react', 'react-dom', /^@myorg\//],
  },
})
```

### noExternal → deps.alwaysBundle

```ts
// Before (tsup)
export default defineConfig({
  noExternal: ['lodash-es'],
})

// After (tsdown)
export default defineConfig({
  deps: {
    alwaysBundle: ['lodash-es'],
  },
})
```

### Combined Example

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

## Full Migration Example

```ts
// Before (tsup.config.ts)
import {defineConfig} from 'tsup'
import myPlugin from 'unplugin-example/esbuild'

export default defineConfig({
  entryPoints: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  bundle: true,
  external: ['react'],
  noExternal: ['lodash-es'],
  publicDir: 'public',
  cjsInterop: true,
  removeNodeProtocol: true,
  injectStyle: true,
  esbuildPlugins: [myPlugin()],
  splitting: true,
  clean: true,
})

// After (tsdown.config.ts)
import {defineConfig} from 'tsdown'
import myPlugin from 'unplugin-example/rolldown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  deps: {
    neverBundle: ['react'],
    alwaysBundle: ['lodash-es'],
  },
  copy: 'public',
  cjsDefault: true,
  nodeProtocol: 'strip',
  css: {inject: true},
  plugins: [myPlugin()],
  // splitting removed — always enabled in tsdown
  clean: true,
})
```

## Related

- [guide-differences-detailed.md](guide-differences-detailed.md) - Architecture and feature comparison
- [guide-package-json.md](guide-package-json.md) - Package.json migration
