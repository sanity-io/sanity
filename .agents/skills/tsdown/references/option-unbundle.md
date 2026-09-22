# Unbundle Mode

Preserve source directory structure in output.

## Overview

Unbundle mode (also called "bundleless" or "transpile-only") outputs files that mirror your source structure, rather than bundling everything into single files. Each source file is compiled individually with a one-to-one mapping.

## Basic Usage

### CLI

```bash
tsdown --unbundle
```

### Config File

```ts
export default defineConfig({
  entry: ['src/**/*.ts', '!**/*.test.ts'],
  unbundle: true,
})
```

## How It Works

### Source Structure

```
src/
├── index.ts
├── utils/
│   ├── helper.ts
│   └── format.ts
└── components/
    └── button.ts
```

### With Unbundle

**Config:**

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  unbundle: true,
})
```

**Output:**

```
dist/
├── index.mjs
├── utils/
│   ├── helper.mjs
│   └── format.mjs
└── components/
    └── button.mjs
```

All imported files are output individually, preserving structure.

### Without Unbundle (Default)

**Output:**

```
dist/
└── index.mjs  (all code bundled together)
```

## When to Use

### Use Unbundle When:

✅ Building monorepo packages with shared utilities
✅ Users need to import individual modules
✅ Want clear source-to-output mapping
✅ Library with many independent utilities
✅ Debugging requires tracing specific files
✅ Incremental builds for faster development

### Use Standard Bundling When:

❌ Single entry point application
❌ Want to optimize bundle size
❌ Need aggressive tree shaking
❌ Creating IIFE/UMD bundles
❌ Deploying to browsers directly

## Common Patterns

### Utility Library

```ts
export default defineConfig({
  entry: ['src/**/*.ts', '!**/*.test.ts'],
  format: ['esm', 'cjs'],
  unbundle: true,
  dts: true,
})
```

**Benefits:**

- Users import only what they need
- Tree shaking still works at user's build
- Clear module boundaries

**Usage:**

```ts
// Users can import specific utilities
import {helper} from 'my-lib/utils/helper'
import {Button} from 'my-lib/components/button'
```

### Monorepo Shared Package

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  unbundle: true,
  outDir: 'dist',
})
```

### TypeScript Compilation Only

```ts
export default defineConfig({
  entry: ['src/**/*.ts'],
  format: ['esm'],
  unbundle: true,
  minify: false,
  treeshake: false,
  dts: true,
})
```

Pure TypeScript to JavaScript transformation.

### Development Mode

```ts
export default defineConfig((options) => ({
  entry: ['src/**/*.ts'],
  unbundle: options.watch, // Unbundle in dev only
  minify: !options.watch,
}))
```

Fast rebuilds during development, optimized for production.

## With Entry Patterns

### Include/Exclude

```ts
export default defineConfig({
  entry: ['src/**/*.ts', '!**/*.test.ts', '!**/*.spec.ts', '!**/fixtures/**'],
  unbundle: true,
})
```

### Multiple Entry Points

```ts
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  unbundle: true,
})
```

Both entry files and all imports preserved.

## Output Control

### Custom Extension

```ts
export default defineConfig({
  entry: ['src/**/*.ts'],
  unbundle: true,
  outExtensions: () => ({js: '.js'}),
})
```

### Preserve Directory

```ts
export default defineConfig({
  entry: ['src/**/*.ts'],
  unbundle: true,
  outDir: 'lib',
})
```

**Output:**

```
lib/
├── index.js
├── utils/
│   └── helper.js
└── components/
    └── button.js
```

## Package.json Setup

```json
{
  "name": "my-library",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./utils/*": "./dist/utils/*.js",
    "./components/*": "./dist/components/*.js"
  },
  "files": ["dist"]
}
```

Or use `exports: true` to auto-generate.

## Comparison

| Feature        | Bundled    | Unbundled    |
| -------------- | ---------- | ------------ |
| Output files   | Few        | Many         |
| File size      | Smaller    | Larger       |
| Build speed    | Slower     | Faster       |
| Tree shaking   | Build time | User's build |
| Source mapping | Complex    | Simple       |
| Module imports | Entry only | Any module   |
| Dev rebuilds   | Slower     | Faster       |

## Performance

### Build Speed

Unbundle is typically faster:

- No bundling overhead
- Parallel file processing
- Incremental builds possible

### Bundle Size

Unbundle produces larger output:

- Each file has its own overhead
- No cross-module optimizations
- User's bundler handles final optimization

## Tips

1. **Use with glob patterns** for multiple files
2. **Enable in development** for faster rebuilds
3. **Let users bundle** for production optimization
4. **Preserve structure** for utilities/components
5. **Combine with DTS** for type definitions
6. **Use with monorepos** for shared code

## Troubleshooting

### Too Many Files

- Adjust entry patterns
- Exclude unnecessary files
- Use specific entry points

### Missing Files

- Check entry patterns
- Verify files are imported
- Look for excluded patterns

### Import Paths Wrong

- Check relative paths
- Verify output structure
- Update package.json exports

## CLI Examples

```bash
# Enable unbundle
tsdown --unbundle

# With specific entry
tsdown src/**/*.ts --unbundle

# With other options
tsdown --unbundle --format esm --dts
```

## Related Options

- [Root Directory](option-root.md) - Control output directory mapping
- [Entry](option-entry.md) - Entry patterns
- [Output Directory](option-output-directory.md) - Output location
- [Output Format](option-output-format.md) - Module formats
- [DTS](option-dts.md) - Type declarations
