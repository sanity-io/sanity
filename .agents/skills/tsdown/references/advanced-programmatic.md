# Programmatic Usage

Use tsdown from JavaScript/TypeScript code.

## Overview

tsdown can be imported and used programmatically in your Node.js scripts, custom build tools, or automation workflows.

## Basic Usage

### Simple Build

```ts
import {build} from 'tsdown'

await build({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
})
```

### With Options

```ts
import {build} from 'tsdown'

await build({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  dts: true,
  minify: true,
  sourcemap: true,
  clean: true,
})
```

### In-Memory Output

Set `write: false` to access generated chunks and assets without writing the
bundle output to disk:

```ts
import {build} from 'tsdown'

const bundles = await build({
  entry: ['src/index.ts'],
  format: 'esm',
  write: false,
  clean: false,
})

for (const bundle of bundles) {
  for (const output of bundle.chunks) {
    const contents = output.type === 'chunk' ? output.code : output.source
    console.log(output.fileName, contents)
  }
}
```

`build()` currently returns a `TsdownBundle[]`, with one bundle for each
resolved configuration. Even a single configuration returns an array; its
in-memory Rolldown outputs are available in `bundle.chunks`.

The `write` option controls Rolldown's bundle output, while other file operations
are configured separately. For example, `clean` defaults to `true`, so set
`clean: false` as above if existing output directories must remain untouched.
Explicitly enabled features such as `copy` or `exports` may still write files.
`write: false` is incompatible with watch mode.

## API Reference

### build()

Main function to run a build.

```ts
import {build} from 'tsdown'

await build(options)
```

**Parameters:**

- `options` - Build configuration object (same as config file)

**Returns:**

- `Promise<TsdownBundle[]>` - One bundle for each resolved configuration

**Throws:**

- Build errors if compilation fails

## Configuration Object

All config file options are available:

```ts
import {build, defineConfig} from 'tsdown'

const config = defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  minify: true,
  sourcemap: true,
  deps: {
    neverBundle: ['react', 'react-dom'],
  },
  plugins: [/* plugins */],
  hooks: {
    'build:done': async () => {
      console.log('Build complete!')
    },
  },
})

await build(config)
```

See [Config Reference](option-config-file.md) for all options.

## Common Patterns

### Custom Build Script

```ts
// scripts/build.ts
import {build} from 'tsdown'

async function main() {
  console.log('Building library...')

  await build({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
  })

  console.log('Build complete!')
}

main().catch(console.error)
```

Run with:

```bash
tsx scripts/build.ts
```

### Multiple Builds

```ts
import {build} from 'tsdown'

// Build main library
await build({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  dts: true,
})

// Build CLI tool
await build({
  entry: ['src/cli.ts'],
  format: ['esm'],
  outDir: 'dist/bin',
  platform: 'node',
  shims: true,
})
```

### Conditional Build

```ts
import {build} from 'tsdown'

const isDev = process.env.NODE_ENV === 'development'

await build({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  minify: !isDev,
  sourcemap: isDev,
  clean: !isDev,
})
```

### With Error Handling

```ts
import {build} from 'tsdown'

try {
  await build({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
  })
  console.log('✅ Build successful')
} catch (error) {
  console.error('❌ Build failed:', error)
  process.exit(1)
}
```

### Automated Workflow

```ts
import {build} from 'tsdown'
import {execSync} from 'child_process'

async function release() {
  // Clean
  console.log('Cleaning...')
  execSync('rm -rf dist')

  // Build
  console.log('Building...')
  await build({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    minify: true,
  })

  // Test
  console.log('Testing...')
  execSync('npm test')

  // Publish
  console.log('Publishing...')
  execSync('npm publish')
}

release().catch(console.error)
```

### Build with Post-Processing

```ts
import {build} from 'tsdown'
import {copyFileSync} from 'fs'

await build({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  hooks: {
    'build:done': async () => {
      // Copy additional files
      copyFileSync('README.md', 'dist/README.md')
      copyFileSync('LICENSE', 'dist/LICENSE')
      console.log('Copied additional files')
    },
  },
})
```

## Watch Mode

Unfortunately, watch mode is not directly exposed in the programmatic API. Use the CLI for watch mode:

```ts
// Use CLI for watch mode
import {spawn} from 'child_process'

spawn('tsdown', ['--watch'], {
  stdio: 'inherit',
  shell: true,
})
```

## Integration Examples

### With Task Runner

```ts
// gulpfile.js
import {build} from 'tsdown'
import gulp from 'gulp'

gulp.task('build', async () => {
  await build({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
  })
})

gulp.task('watch', () => {
  return gulp.watch('src/**/*.ts', gulp.series('build'))
})
```

### With Custom CLI

```ts
// scripts/cli.ts
import {build} from 'tsdown'
import {Command} from 'commander'

const program = new Command()

program
  .command('build')
  .option('--prod', 'Production build')
  .action(async (options) => {
    await build({
      entry: ['src/index.ts'],
      format: ['esm', 'cjs'],
      minify: options.prod,
      sourcemap: !options.prod,
    })
  })

program.parse()
```

### With CI/CD

```ts
// .github/scripts/build.ts
import {build} from 'tsdown'

const isCI = process.env.CI === 'true'

await build({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  minify: isCI,
  clean: true,
})

// Upload to artifact storage
if (isCI) {
  // Upload dist/ to S3, etc.
}
```

## TypeScript Support

```ts
// scripts/build.ts
import {build, type UserConfig} from 'tsdown'

const config: UserConfig = {
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
}

await build(config)
```

## Tips

1. **Use TypeScript** for type safety
2. **Handle errors** properly
3. **Use hooks** for custom logic
4. **Log progress** for visibility
5. **Use CLI for watch** mode
6. **Exit on error** in scripts

## Troubleshooting

### Import Errors

Ensure tsdown is installed:

```bash
pnpm add -D tsdown
```

### Type Errors

Import types:

```ts
import type {UserConfig} from 'tsdown'
```

### Build Fails Silently

Add error handling:

```ts
try {
  await build(config)
} catch (error) {
  console.error(error)
  process.exit(1)
}
```

### Options Not Working

Check spelling and types:

```ts
// ✅ Correct
{
  format: ['esm', 'cjs']
}

// ❌ Wrong
{
  formats: ['esm', 'cjs']
}
```

## Related

- [Config File](option-config-file.md) - Configuration options
- [Hooks](advanced-hooks.md) - Lifecycle hooks
- [CLI](reference-cli.md) - Command-line interface
- [Plugins](advanced-plugins.md) - Plugin system
