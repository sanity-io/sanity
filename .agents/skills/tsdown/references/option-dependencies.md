# Dependencies

Control how dependencies are bundled or externalized.

## Overview

tsdown intelligently handles dependencies to keep your library lightweight while ensuring all necessary code is included.

## Default Behavior

### Auto-Externalized

These are **NOT bundled** by default:

- **`dependencies`** - Installed automatically with your package
- **`peerDependencies`** - User must install manually
- **`optionalDependencies`** - May or may not be installed depending on platform/config

### Conditionally Bundled

These are **bundled ONLY if imported**:

- **`devDependencies`** - Only if actually used in source code
- **Phantom dependencies** - In node_modules but not in package.json

## Configuration Options

All dependency options are grouped under the `deps` field:

```ts
export default defineConfig({
  deps: {
    neverBundle: ['react', /^@myorg\//],
    alwaysBundle: ['some-package'],
    onlyBundle: ['cac', 'bumpp'],
    onlyImport: ['cac'],
    resolveDepSubpath: true,
  },
})
```

### `deps.neverBundle`

Mark dependencies as external (not bundled):

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  deps: {
    neverBundle: [
      'react', // Single package
      'react-dom',
      /^@myorg\//, // Regex pattern (all @myorg/* packages)
      /^lodash/, // All lodash packages
    ],
  },
})
```

Set to `true` to externalize ALL dependencies:

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  deps: {
    neverBundle: true,
  },
})
```

**Result:** Every import that follows npm package naming conventions is externalized as written, without being resolved. This is fast and even works when dependencies are not installed. Subpaths like `my-dep/utils` are preserved exactly unless `resolveDepSubpath` is enabled. Other non-relative imports (`#` subpath imports, path aliases like `~/`) are resolved: they stay external if they resolve into node_modules, and are bundled if they map to local files. Combine with `alwaysBundle` to bundle selected dependencies.

### `deps.alwaysBundle`

Force dependencies to be bundled:

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  deps: {
    alwaysBundle: [
      'some-package', // Bundle this even if in dependencies
      'vendor-lib',
    ],
  },
})
```

### `deps.onlyBundle`

Whitelist of dependencies allowed to be bundled from node_modules. Throws an error if any unlisted dependency is bundled:

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  deps: {
    onlyBundle: [
      'cac', // Allow bundling cac
      'bumpp', // Allow bundling bumpp
      /^my-utils/, // Regex patterns supported
    ],
  },
})
```

**Behavior:**

- **Array** (`['cac', /^my-/]`): Only matching dependencies can be bundled. Error for others.
- **`false`**: Suppress all warnings about bundled dependencies.
- **Not set** (default): Warns if any node_modules dependencies are bundled.

**Note:** Include all sub-dependencies in the list, not just top-level imports.

### `deps.onlyImport`

Whitelist of packages the emitted output is allowed to import at runtime. Throws an error (listing all violations) if any chunk imports an unlisted package:

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  deps: {
    onlyImport: [
      'cac', // Also covers subpath imports like cac/deno
      /^my-utils/, // Regex patterns match the package name
    ],
  },
})
```

**Behavior:**

- Matching is based on the package name; subpath imports (`cac/deno`) match `cac`.
- Node.js built-in modules are always allowed when `platform` is `node`.
- Relative imports between code-split chunks are always allowed.
- Declaration output (`.d.ts`) is checked too.

**Limitation:** ES imports and dynamic `import()` expressions are checked. CJS `require()` calls are not detected.

### `deps.resolveDepSubpath`

By default, tsdown preserves external dependency subpath imports as written. Enable `resolveDepSubpath` to resolve subpath imports to their actual package-relative paths when a package has no `exports` field. For example, `my-dep/functions/lt` may become `my-dep/functions/lt.js`, and `my-dep/folder` may become `my-dep/folder/index.js`.

```ts
export default defineConfig({
  deps: {
    resolveDepSubpath: true, // default: false
  },
})
```

## Common Patterns

### React Component Library

```ts
export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  deps: {
    neverBundle: [
      'react',
      'react-dom',
      /^react\//, // react/jsx-runtime, etc.
    ],
  },
  dts: true,
})
```

### Utility Library with Shared Deps

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  deps: {
    alwaysBundle: ['lodash-es'],
  },
  dts: true,
})
```

### Monorepo Package

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  deps: {
    neverBundle: [
      /^@mycompany\//, // Don't bundle other workspace packages
    ],
  },
  dts: true,
})
```

### CLI Tool (Bundle Everything)

```ts
export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  platform: 'node',
  deps: {
    alwaysBundle: [/.*/],
  },
  shims: true,
})
```

### Library with Specific Externals

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  deps: {
    neverBundle: ['vue', '@vue/runtime-core', '@vue/reactivity'],
  },
  dts: true,
})
```

## Declaration Files

Dependency handling for `.d.ts` files follows the same rules as JavaScript.

### Complex Type Resolution

Use TypeScript resolver for complex third-party types:

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  dts: {
    resolver: 'tsc', // Use TypeScript resolver instead of Oxc
  },
})
```

**When to use `tsc` resolver:**

- Types in `@types/*` packages with non-standard naming (e.g., `@types/babel__generator`)
- Complex type dependencies
- Issues with default Oxc resolver

**Trade-off:** `tsc` is slower but more compatible.

## CLI Usage

### Never Bundle

```bash
tsdown --deps.never-bundle react --deps.never-bundle react-dom
tsdown --deps.never-bundle '/^@myorg\/.*/'
```

## Migration from Deprecated Options

| Deprecated Option | New Option          |
| ----------------- | ------------------- |
| `external`        | `deps.neverBundle`  |
| `noExternal`      | `deps.alwaysBundle` |

## Examples by Use Case

### Framework Component

```ts
// Don't bundle framework
export default defineConfig({
  deps: {
    neverBundle: ['vue', 'react', 'solid-js', 'svelte'],
  },
})
```

### Standalone App

```ts
// Bundle everything
export default defineConfig({
  deps: {
    alwaysBundle: [/.*/],
  },
})
```

### Shared Library

```ts
// Bundle only specific utils
export default defineConfig({
  deps: {
    neverBundle: [/.*/], // External by default
    alwaysBundle: ['tiny-utils'], // Except this one
  },
})
```

### Monorepo Package

```ts
// External workspace packages, bundle utilities
export default defineConfig({
  deps: {
    neverBundle: [
      /^@workspace\//, // Other workspace packages
      'react',
      'react-dom',
    ],
    alwaysBundle: [
      'lodash-es', // Bundle utility libraries
    ],
  },
})
```

## Troubleshooting

### Dependency Bundled Unexpectedly

Check if it's in `devDependencies` and imported. Move to `dependencies`:

```json
{
  "dependencies": {
    "should-be-external": "^1.0.0"
  }
}
```

Or explicitly externalize:

```ts
export default defineConfig({
  deps: {
    neverBundle: ['should-be-external'],
  },
})
```

### Missing Dependency at Runtime

Ensure it's in `dependencies`, `peerDependencies`, or `optionalDependencies`:

```json
{
  "dependencies": {
    "needed-package": "^1.0.0"
  }
}
```

Or bundle it:

```ts
export default defineConfig({
  deps: {
    alwaysBundle: ['needed-package'],
  },
})
```

### Type Resolution Errors

Use TypeScript resolver for complex types:

```ts
export default defineConfig({
  dts: {
    resolver: 'tsc',
  },
})
```

## Summary

**Default behavior:**

- `dependencies`, `peerDependencies`, & `optionalDependencies` → External
- `devDependencies` & phantom deps → Bundled if imported

**Override (under `deps`):**

- `neverBundle` → Force external
- `alwaysBundle` → Force bundled
- `onlyBundle` → Whitelist bundled deps
- `onlyImport` → Whitelist runtime imports in output
- `neverBundle: true` → Externalize all dependencies
- `resolveDepSubpath: true` → Resolve external dependency subpath imports to package-relative paths

**Declaration files:**

- Same bundling logic as JavaScript
- Use `resolver: 'tsc'` for complex types

## Tips

1. **Keep dependencies external** for libraries
2. **Bundle everything** for standalone CLIs
3. **Use regex patterns** for namespaced packages
4. **Check bundle size** to verify external/bundled split
5. **Test with fresh install** to catch missing dependencies
6. **Use tsc resolver** only when needed (slower)

## Related Options

- [External](option-dependencies.md) - This page
- [Platform](option-platform.md) - Runtime environment
- [Output Format](option-output-format.md) - Module formats
- [DTS](option-dts.md) - Type declarations
