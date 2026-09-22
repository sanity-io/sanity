# Executable - `exe`

**[experimental]** Bundle as a standalone executable using [Node.js Single Executable Applications](https://nodejs.org/api/single-executable-applications.html).

## Requirements

- Node.js >= 25.7.0
- Not supported in Bun or Deno

## Basic Usage

```ts
export default defineConfig({
  entry: ['src/cli.ts'],
  exe: true,
})
```

## Behavior When Enabled

- Declaration file generation (`dts`) is disabled by default
- Code splitting is disabled
- Only single entry points are supported
- Legacy CJS warnings are suppressed

## Advanced Configuration

```ts
export default defineConfig({
  entry: ['src/cli.ts'],
  exe: {
    fileName: 'my-tool',
    seaConfig: {
      disableExperimentalSEAWarning: true,
      useCodeCache: true,
      useSnapshot: false,
    },
  },
})
```

## `ExeOptions`

| Option      | Type                                                  | Description                                                   |
| ----------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| `seaConfig` | `Omit<SeaConfig, 'main' \| 'output' \| 'mainFormat'>` | Node.js configuration options                                 |
| `fileName`  | `string \| ((chunk) => string)`                       | Custom output file name (without `.exe` or platform suffixes) |
| `targets`   | `ExeTarget[]`                                         | Cross-platform build targets (requires `@tsdown/exe`)         |

## `SeaConfig`

See [Node.js Single Executable Applications documentation](https://nodejs.org/api/single-executable-applications.html).

| Option                          | Type                       | Default | Description                      |
| ------------------------------- | -------------------------- | ------- | -------------------------------- |
| `disableExperimentalSEAWarning` | `boolean`                  | `true`  | Disable the experimental warning |
| `useSnapshot`                   | `boolean`                  | `false` | Use V8 snapshot                  |
| `useCodeCache`                  | `boolean`                  | `false` | Use V8 code cache                |
| `execArgv`                      | `string[]`                 | -       | Extra Node.js arguments          |
| `execArgvExtension`             | `'none' \| 'env' \| 'cli'` | `'env'` | How to extend execArgv           |
| `assets`                        | `Record<string, string>`   | -       | Assets to embed                  |

## Cross-Platform Builds

Install `@tsdown/exe` to build executables for multiple platforms from a single machine:

```bash
pnpm add -D @tsdown/exe
```

```ts
export default defineConfig({
  entry: ['src/cli.ts'],
  exe: {
    targets: [
      {platform: 'linux', arch: 'x64', nodeVersion: '25.7.0'},
      {platform: 'darwin', arch: 'arm64', nodeVersion: '25.7.0'},
      {platform: 'win', arch: 'x64', nodeVersion: '25.7.0'},
    ],
  },
})
```

This downloads the target platform's Node.js binary, caches it locally, and produces platform-suffixed output:

```
dist/
  cli-linux-x64
  cli-darwin-arm64
  cli-win-x64.exe
```

### `ExeTarget`

| Field         | Type                           | Description                                                                                   |
| ------------- | ------------------------------ | --------------------------------------------------------------------------------------------- |
| `platform`    | `'win' \| 'darwin' \| 'linux'` | Target OS (nodejs.org naming)                                                                 |
| `arch`        | `'x64' \| 'arm64'`             | Target CPU architecture                                                                       |
| `nodeVersion` | `string`                       | Node.js version (must be `>=25.7.0`), or `'latest'` / `'latest-lts'` to resolve automatically |

### Custom Node.js Index and Download URL

When downloading Node.js binaries (e.g. behind a corporate proxy or using a mirror), you can customize the sources:

```ts
export default defineConfig({
  entry: ['src/cli.ts'],
  exe: {
    targets: [{platform: 'linux', arch: 'x64', nodeVersion: 'latest-lts'}],
    // Index used to resolve 'latest' / 'latest-lts' versions
    nodeDistIndexUrl: 'https://mirrors.example.com/node/index.json', // default: https://nodejs.org/dist/index.json
    // Fully custom download URL per target
    getDownloadUrl: (target) =>
      `https://mirrors.example.com/node/v${target.nodeVersion}/node-v${target.nodeVersion}-${target.platform}-${target.arch}.tar.gz`,
  },
})
```

### Caching

Downloaded Node.js binaries are cached in system cache directories:

- **macOS:** `~/Library/Caches/tsdown/node/`
- **Linux:** `~/.cache/tsdown/node/`
- **Windows:** `%LOCALAPPDATA%/tsdown/Caches/node/`

## Platform Notes

- On macOS, the executable is automatically codesigned (ad-hoc) for Gatekeeper compatibility
- On Windows, the `.exe` extension is automatically appended
- When `targets` is specified, `seaConfig.executable` is ignored

## CLI

```bash
tsdown --exe
tsdown src/cli.ts --exe
```
