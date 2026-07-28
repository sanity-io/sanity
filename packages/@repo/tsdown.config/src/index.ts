import {defineConfig as defineTsdownConfig, type PackageOptions} from '@sanity/tsdown-config'
import {type UserConfig} from 'tsdown'

// oxlint-disable-next-line no-control-regex
const ANSI_ESCAPES = /\u001B\[[0-9;]*m/g
const CIRCULAR_DEPENDENCY_PREFIX = 'Circular dependency: '

/**
 * Matches rolldown's `CIRCULAR_DEPENDENCY` warnings where every module in the cycle is a `.d.ts`
 * file. Those come from the declaration bundling pass, where all imports are type-only and erased
 * at runtime, so the cycles are harmless and unavoidable for mutually referencing public types
 * (e.g. the schema definition types in `@sanity/types`). Suppressing them keeps the check's
 * signal for real runtime import cycles.
 */
function isTypeOnlyCircularDependencyWarning(message: string): boolean {
  // The message arrives pre-formatted, e.g. `\u001B[33m[CIRCULAR_DEPENDENCY] \u001B[0mCircular
  // dependency: src/a.d.ts -> src/b.d.ts -> src/a.d.ts.`
  const plain = message.replace(ANSI_ESCAPES, '')
  const start = plain.indexOf(CIRCULAR_DEPENDENCY_PREFIX)
  if (start === -1) return false
  return plain
    .slice(start + CIRCULAR_DEPENDENCY_PREFIX.length)
    .trim()
    .replace(/\.$/, '')
    .split(' -> ')
    .every((module) => module.endsWith('.d.ts'))
}

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
 * - `suppressWarnings` - drop circular dependency warnings for cycles that only involve `.d.ts`
 *   files (type-only, no runtime effect); runtime import cycles still warn
 */
export async function defineConfig(options: PackageOptions = {}): Promise<UserConfig> {
  const config = await defineTsdownConfig({
    tsconfig: 'tsconfig.lib.json',
    dts: {tsgo: true},
    exports: {devExports: 'monorepo', bin: false},
    outDir: 'lib',
    clean: ['lib'],
    ...options,
    define: {__DEV__: 'false', ...options.define},
  })

  return {...config, suppressWarnings: isTypeOnlyCircularDependencyWarning}
}
