import {cwd} from 'node:process'

import {lightningCssTargets, readPackageBrowserslist} from '@repo/browser-targets'
import {defineConfig as defineTsdownConfig, type PackageOptions} from '@sanity/tsdown-config'
import {type UserConfig} from 'tsdown'

/**
 * Shared tsdown configuration for the published packages in this monorepo, built on top of
 * `@sanity/tsdown-config`, with these defaults:
 *
 * - `tsconfig: 'tsconfig.lib.json'` - build/dts config (`noCheck: true`; type checking is via oxlint)
 * - `dts: {generator: 'tsgo'}` - generate `.d.ts` files with the TypeScript 7 native compiler
 *   (`tsc`); declaration emit only — type checking is owned by oxlint (`options.typeCheck`).
 *   Packages must depend on `typescript` (catalog, v7+) so rolldown-plugin-dts can resolve it
 * - `exports.devExports: 'monorepo'` - local builds regenerate the `exports` map in
 *   `package.json` with the `monorepo` condition pointing at the sources (resolved by the
 *   monorepo tsconfigs and the dev studios) while `publishConfig.exports` receives the built
 *   files. Generation is skipped in CI (`enabled: 'local-only'`, the tsdown-config default),
 *   where the committed `package.json` is already up to date. `bin` generation is disabled,
 *   `sanity` ships a hand-written `bin/sanity` wrapper.
 * - `define: {__DEV__: 'false'}` - the same build-time constant `@sanity/pkg-utils` used to inject
 * - `outDir: 'lib'` - the packages publish `lib`, not tsdown's default `dist`
 * - `clean: ['lib']` - remove `lib` before each build (include `outDir` when overriding with
 *   a package-specific array; a `string[]` replaces tsdown's default of cleaning only `outDir`)
 * - the extracted CSS of the `panda` and `css` pipelines is lowered for the browsers of the
 *   package's own `browserslist` field (Baseline 2026, see "Browser support" in the `sanity`
 *   README), instead of the `@sanity/browserslist-config` fallback that `@sanity/tsdown-config`
 *   applies when the target names no browsers. The JS target stays the one tsdown derives from
 *   `engines.node`: Node.js 24.11 is older than every Baseline 2026 browser engine, so it is the
 *   binding constraint for JS syntax
 */
export function defineConfig(options: PackageOptions = {}): Promise<UserConfig> {
  const {css} = options
  const panda = options.panda === true ? {} : options.panda
  const targets =
    panda || css ? lightningCssTargets(readPackageBrowserslist(options.cwd ?? cwd())) : {}

  return defineTsdownConfig({
    tsconfig: 'tsconfig.lib.json',
    dts: {generator: 'tsgo'},
    exports: {devExports: 'monorepo', bin: false},
    outDir: 'lib',
    clean: ['lib'],
    ...options,
    ...(panda && {panda: {...panda, lightningcss: {targets, ...panda.lightningcss}}}),
    ...(css && {css: {...css, lightningcss: {targets, ...css.lightningcss}}}),
    define: {__DEV__: 'false', ...options.define},
  })
}
