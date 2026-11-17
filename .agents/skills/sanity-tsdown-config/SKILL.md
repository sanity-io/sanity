---
name: sanity-tsdown-config
description: Configure Sanity libraries with @sanity/tsdown-config, including its publishing defaults, React transforms, CSS extraction, TSDoc checks, and advanced tsdown composition. Use when creating or editing tsdown.config.ts for a Sanity package, or when deciding between PackageOptions and stock tsdown options.
license: MIT
metadata:
  author: sanity-io
  version: '0.28'
---

# `@sanity/tsdown-config`

Use this skill for Sanity's opinionated wrapper around tsdown. Use the separately installable
`tsdown` skill for generic tsdown concepts and options:

```sh
npx skills add rolldown/tsdown --skill tsdown
```

This skill owns the wrapper's defaults and integration points. Do not replace the wrapper with a
raw `tsdown` config unless the package explicitly does not want Sanity's library conventions.

## Install and configure

`@sanity/tsdown-config` 0.28.x requires Node.js `^22.18.0 || ^24.11.0 || >=26.0.0`.

```sh
pnpm add -D @sanity/tsdown-config tsdown
```

Create `tsdown.config.ts`:

```ts
import {defineConfig} from '@sanity/tsdown-config'

export default defineConfig({tsconfig: 'tsconfig.dist.json'})
```

Prefer a distribution tsconfig that includes only publishable source. Let package metadata drive
declaration generation: tsdown enables `dts` when `package.json` has a `types` field or a `types`
condition in `exports`.

Build and watch with tsdown:

```sh
pnpm tsdown
pnpm tsdown --watch
```

## Know the defaults

Do not restate these unless intentionally overriding them:

| Behavior              | `@sanity/tsdown-config` default                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Platform              | `'neutral'`; also externalizes `node:` built-ins and restores `module`/`main` resolution for inlined dependencies without exports |
| Format                | `'esm'`                                                                                                                           |
| Source maps           | `true` (stock tsdown defaults to `false`)                                                                                         |
| Package exports       | Always generated; in pnpm projects, `devExports: true` points local exports at source and puts built exports in `publishConfig`   |
| Package validation    | `publint: true`                                                                                                                   |
| Dependency subpaths   | `deps.resolveDepSubpath: true`                                                                                                    |
| Circular dependencies | `checks.circularDependency: true`; declaration-only cycles are suppressed, runtime cycles still warn                              |
| Minification          | Compression/dead-code elimination only; no mangling or whitespace codegen; function and class names are preserved                 |
| Report                | `{gzip: false}`                                                                                                                   |
| Cleaning              | Stock tsdown default: clean `outDir` (`dist`)                                                                                     |
| Output directory      | Stock tsdown default: `dist`                                                                                                      |
| Chunk names           | Keep tsdown's hashed default                                                                                                      |

The neutral platform is deliberate for isomorphic packages. Do not switch to `'node'` merely
because some source imports Node APIs: `'node'` can emit module-scope CommonJS interop that crashes
browser bundles. Set a specific platform only when the package is truly runtime-specific.

The exports feature rewrites `package.json` on every build, including when `CI=true`. Review the
resulting local `exports` and `publishConfig.exports`.

## Use `PackageOptions` first

The wrapper directly exposes common package options: `tsconfig`, `entry`, `format`, `dts`, `define`,
`target`, `outDir`, `clean`, `platform`, `cwd`, `exports`, `sourcemap`, `deps`, `css`,
`vanillaExtract`, `reactCompiler`, `styledComponents`, `bundleAnalyzer`, `tsdoc`, and
`suppressWarnings`.

Add only what the package needs:

```ts
import {defineConfig} from '@sanity/tsdown-config'

export default defineConfig({
  tsconfig: 'tsconfig.dist.json',
  deps: {neverBundle: [/^some-package(\/|$)/]},
  tsdoc: true,
})
```

Under the neutral platform, user `deps.neverBundle` entries are appended to the built-in
`/^node:/` external rather than replacing it. Strings use tsdown matching semantics; use a regular
expression when a dependency's subpaths must also match.

## Opt-in features

### React Compiler

The default implementation is Oxc and requires:

```sh
pnpm add -D oxc-transform-react
```

```ts
export default defineConfig({
  tsconfig: 'tsconfig.dist.json',
  reactCompiler: true,
})
```

Use `reactCompiler: {target: '18'}` for compiler options. Choose the Babel reference
implementation only for features the Oxc port does not support, such as a custom
`jsxImportSource`, a logger, or function-valued `sources`:

```sh
pnpm add -D @rolldown/plugin-babel @babel/core babel-plugin-react-compiler
```

```ts
reactCompiler: {target: '19', transform: 'babel'}
```

For an isomorphic component library, `reactCompiler: {target: '19', reactServer: true}` emits an
additional uncompiled `react-server` variant and adds that export condition. This is experimental,
creates two module instances across conditions, and is unnecessary for client-only packages that
ship `'use client'`.

### styled-components

Set `styledComponents: true` to add display names and stable component IDs and to minify tagged
CSS. This uses Oxc's native transform; do not install `babel-plugin-styled-components`.

### CSS and vanilla-extract

- `vanillaExtract: true` extracts `.css.ts` files to `dist/bundle.css`.
- `css: {...}` enables plain CSS, CSS modules, preprocessors, and PostCSS through the optional
  `@tsdown/css` peer. Install it with `pnpm add -D @tsdown/css`.
- Both default CSS minification to `true`, use Sanity browser targets when the JS target has no
  browsers, and publish a conditional CSS export with a no-op Node shim.
- Both can be enabled together: vanilla-extract uses `bundle.css`; `css` uses `style.css`.
- Add published CSS to `package.json#sideEffects`, for example `"sideEffects": ["*.css"]`.

Install `@vanilla-extract/css` when authoring `.css.ts` files. It is separate from the tsdown
plugin bundled by this wrapper.

### Bundle analysis

Keep analysis opt-in:

```ts
bundleAnalyzer: process.env.ENABLE_BUNDLE_ANALYZER === 'true'
```

`true` emits the LLM-friendly `dist/analyze-data.md`. Exclude the report from `package.json#files`;
it is not a publishable artifact.

### TSDoc

Set `tsdoc: true` to run API Extractor after the build for TSDoc syntax and release-tag checks.
This is off by default. It validates emitted entry declarations; it is not a replacement for
TypeScript type-checking.

## Reach stock tsdown through `mergeConfig`

`PackageOptions` is intentionally smaller than `UserConfig`. For a stock tsdown option it does not
expose, await the Sanity config and merge over it:

```ts
import {defineConfig} from '@sanity/tsdown-config'
import {mergeConfig} from 'tsdown'

export default mergeConfig(await defineConfig({tsconfig: 'tsconfig.dist.json'}), {
  hash: false,
})
```

Use this pattern for advanced tsdown or Rolldown behavior, including overriding
`checks.circularDependency` or the wrapper's compress-only `minify`. `mergeConfig` deep-merges
plain objects, appends plugins, and replaces scalars and non-plugin arrays.

With the `@sanity/tsconfig/isolated-declarations` preset, annotate the export to avoid a
non-portable inferred type:

```ts
import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig() satisfies Promise<UserConfig>
```

Use `Promise<UserConfig[]>` when `reactCompiler.reactServer` is enabled.

## Do not add by default

- Do not enable `exe`; this wrapper targets publishable libraries, not standalone executables.
- Do not enable `devtools`; it is not part of the wrapper's package API or defaults.
- Do not replace compress-only output with full minification. Consumer production builds minify
  dependencies again, while published names and readable output improve debugging.
- Do not design around Storybook. Storybook is an app/demo concern, not this library build
  contract.
- Do not disable exports, publint, circular-dependency checks, or source maps without a concrete
  package requirement.

## Choose the right Sanity tool

Use `@sanity/pkg-utils` and `pkg build` when a conventional Sanity package already describes its
entries and runtime conditions in `package.json#exports`. Use this wrapper directly when the build
needs arbitrary tsdown options, multiple configs, `reactCompiler.reactServer`, or behavior outside
pkg-utils' `package.config.ts` surface.
