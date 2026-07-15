import {defineConfig as defineTsdownConfig, type PackageOptions} from '@sanity/tsdown-config'
import {type UserConfig} from 'tsdown'

/**
 * Shared tsdown configuration for the published packages in this monorepo, built on top of
 * `@sanity/tsdown-config`, with these defaults:
 *
 * - `tsconfig: 'tsconfig.lib.json'` - the same tsconfig the `check:types` scripts use
 * - `dts: {tsgo: true}` - generate `.d.ts` files with tsgo (`@typescript/native-preview`),
 *   matching the repo's tsgo-based type checking (no `typescript` dependency needed)
 * - `exports.devExports: 'monorepo'` - local builds regenerate the `exports` map in
 *   `package.json` with the `monorepo` condition pointing at the sources (resolved by the
 *   monorepo tsconfigs and the dev studios) while `publishConfig.exports` receives the built
 *   files. Generation is skipped in CI (`enabled: 'local-only'`, the tsdown-config default),
 *   where the committed `package.json` is already up to date. `bin` generation is disabled,
 *   `sanity` ships a hand-written `bin/sanity` wrapper.
 * - `define: {__DEV__: 'false'}` - the same build-time constant `@sanity/pkg-utils` used to inject
 */
export function defineConfig(options: PackageOptions = {}): Promise<UserConfig> {
  return defineTsdownConfig({
    tsconfig: 'tsconfig.lib.json',
    dts: {tsgo: true},
    exports: {devExports: 'monorepo', bin: false},
    ...options,
    define: {__DEV__: 'false', ...options.define},
  })
}
