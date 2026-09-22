# Copy Files

Copy static files and directories into the build output.

## Overview

The `copy` option copies assets that should be distributed without being processed by the bundler — images, fonts, license files, etc.

## Basic Usage

### CLI

```bash
tsdown --copy public
```

With the default `outDir` of `dist`, `public/favicon.svg` is copied to `dist/public/favicon.svg`.

### Config File

```ts
export default defineConfig({
  copy: 'public',
})
```

Multiple paths, glob patterns, or object entries in an array:

```ts
export default defineConfig({
  copy: [
    'LICENSE',
    {
      from: ['public/**/*', '!public/**/*.map'],
      to: 'dist/assets',
      flatten: false,
    },
  ],
})
```

Glob patterns support negation with a leading `!`.

**Note:** Relative source and destination paths are resolved from the project root (`cwd`), not from `outDir`.

## Object Options

| Property  | Type                                                | Default  | Description                                                                                                   |
| --------- | --------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `from`    | `string \| string[]`                                | Required | Source path or glob pattern; arrays can include negated patterns                                              |
| `to`      | `string`                                            | `outDir` | Destination path, resolved from the project root                                                              |
| `flatten` | `boolean`                                           | `true`   | Place matched files directly in `to`. Set `false` to preserve the directory structure below the first segment |
| `rename`  | `string \| ((name, extension, fullPath) => string)` | —        | Change the destination name. Callback receives the extension without a leading dot and the absolute path      |
| `verbose` | `boolean`                                           | `false`  | Log each copied source and destination                                                                        |

### Preserve Directory Structure

```ts
export default defineConfig({
  copy: {
    from: 'assets/**/*',
    to: 'dist/public',
    flatten: false,
  },
})
```

`assets/fonts/inter.woff2` → `dist/public/fonts/inter.woff2`.

### Rename Copied Items

```ts
export default defineConfig({
  copy: [
    {from: 'src/file.txt', to: 'dist', rename: 'file.md'},
    {
      from: 'src/file.txt',
      to: 'dist',
      rename: (name, extension) => `${name}-renamed.${extension}`,
    },
  ],
})
```

Creates `dist/file.md` and `dist/file-renamed.txt`.

## Dynamic Configuration

`copy` can be a sync or async callback receiving the resolved tsdown config:

```ts
export default defineConfig({
  copy: ({outDir}) => ({
    from: ['assets/**/*', '!assets/**/*.map'],
    to: `${outDir}/assets`,
    flatten: false,
  }),
})
```

## Build and Watch Behavior

- Copying runs after the bundle output is produced; files are copied without passing through Rolldown transforms.
- A top-level `copy` option runs only once for a multi-format build; a format-specific override can define `copy` again for that format.
- In watch mode, matched source files are watched as build dependencies — changing one triggers a rebuild and copies the current files again.

## Related Options

- [Output Directory](option-output-directory.md) - Where output goes
- [Cleaning](option-cleaning.md) - Output directory cleanup
- [Watch Mode](option-watch-mode.md) - Watch mode behavior
