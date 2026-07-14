import {defineConfig as defineTsdownConfig, type PackageOptions} from '@sanity/tsdown-config'
import {mergeConfig, type UserConfig} from 'tsdown'

/**
 * The `@sanity/tsdown-config` options, plus tsdown's `deps` for the packages that need to tweak
 * dependency bundling (e.g. `sanity` keeps its `sanity/...` self-references external).
 */
export interface MonorepoPackageOptions extends PackageOptions {
  deps?: UserConfig['deps']
}

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
 *
 * The packages run in both browsers and node, so tsdown's default `platform: 'neutral'` is kept.
 * (`platform: 'node'` makes rolldown's CommonJS-interop emit a module-scope
 * `createRequire(import.meta.url)` for inlined CJS devDependencies, which crashes
 * browser-bundled studios.) Two resolution tweaks compensate for the strict neutral defaults:
 * node built-ins are marked external (only node runtimes execute the code paths that use them,
 * and neutral would otherwise warn about them as unresolvable), and the conventional
 * `module`/`main` fallback is restored for inlined devDependencies that ship no `exports` map
 * (e.g. `rxjs-etc/operators`).
 */
export async function defineConfig(options: MonorepoPackageOptions = {}): Promise<UserConfig> {
  const {deps, ...packageOptions} = options

  const base = await defineTsdownConfig({
    tsconfig: 'tsconfig.lib.json',
    dts: {tsgo: true},
    exports: {devExports: 'monorepo', bin: false},
    ...packageOptions,
    define: {__DEV__: 'false', ...packageOptions.define},
  })

  const config = mergeConfig(base, {
    // tsdown doesn't read `sourceMap` from the tsconfig; pkg-utils shipped sourcemaps for the
    // published packages, keep doing that
    sourcemap: true,
    deps: {neverBundle: [/^node:/]},
    inputOptions: {resolve: {mainFields: ['module', 'main']}},
  })

  // `mergeConfig` concatenates the `neverBundle` arrays, so per-package externals add to the
  // `node:` builtins above
  return deps ? mergeConfig(config, {deps}) : config
}
