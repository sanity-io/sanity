import {defineConfig as defineTsdownConfig, type PackageOptions} from '@sanity/tsdown-config'
import {type UserConfig} from 'tsdown'

/**
 * Shared tsdown configuration for the published packages in this monorepo, built on top of
 * `@sanity/tsdown-config`, with these defaults:
 *
 * - `tsconfig: 'tsconfig.lib.json'` - build/dts config (`noCheck: true`; type checking is via oxlint)
 * - `dts: {tsgo: true}` - generate `.d.ts` files with tsgo (`@typescript/native-preview`);
 *   tsgo only emits declarations here — type checking is owned by oxlint (`options.typeCheck`),
 *   and no `typescript` dependency is needed
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
 */
export function defineConfig(options: PackageOptions = {}): Promise<UserConfig> {
  return defineTsdownConfig({
    tsconfig: 'tsconfig.lib.json',
    dts: {tsgo: true},
    exports: {devExports: 'monorepo', bin: false},
    outDir: 'lib',
    clean: ['lib'],
    ...options,
    define: {__DEV__: 'false', ...options.define},
  })
}
