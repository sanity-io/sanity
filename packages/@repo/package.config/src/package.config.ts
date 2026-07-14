import {defineConfig as defineTsdownConfig, type PackageOptions} from '@sanity/tsdown-config'
import {mergeConfig, type UserConfig} from 'tsdown'

/**
 * Shared tsdown configuration for the published packages in this monorepo, built on top of
 * `@sanity/tsdown-config`.
 *
 * Options in `options` are the `@sanity/tsdown-config` options (`entry`, `format`,
 * `reactCompiler`, `styledComponents`, `vanillaExtract`, etc), with these monorepo defaults:
 *
 * - `tsconfig: 'tsconfig.lib.json'` - the same tsconfig the `check:types` scripts use
 * - `dts: {tsgo: true}` - generate `.d.ts` files with tsgo (`@typescript/native-preview`),
 *   matching the repo's tsgo-based type checking (no `typescript` dependency needed)
 * - `exports: false` - the `exports`/`publishConfig.exports` maps in each `package.json` are
 *   maintained by hand (they carry the monorepo-specific `source`/`monorepo` conditions), so
 *   tsdown must not rewrite them
 * - `define: {__DEV__: 'false'}` - the same build-time constant `@sanity/pkg-utils` used to inject
 *
 * Anything not exposed through `@sanity/tsdown-config` (e.g. `deps`, `hash`) can be passed via
 * `overrides`, which is merged over the resolved config with tsdown's `mergeConfig` semantics.
 */
export async function defineConfig(
  options: PackageOptions = {},
  overrides: UserConfig = {},
): Promise<UserConfig> {
  const base = await defineTsdownConfig({
    tsconfig: 'tsconfig.lib.json',
    dts: {tsgo: true},
    exports: false,
    ...options,
    define: {__DEV__: 'false', ...options.define},
  })

  return mergeConfig(
    mergeConfig(base, {
      // Emit to `lib` (tsdown defaults to `dist`), like `dist: 'lib'` in the old pkg-utils config
      outDir: 'lib',
      // pkg-utils shipped sourcemaps for the published packages, keep doing that
      sourcemap: true,
      // Node built-ins stay external imports in the output (only node runtimes execute the code
      // paths that use them). With the default `platform: 'neutral'` rolldown would otherwise warn
      // about them as unresolvable
      deps: {neverBundle: [/^node:/]},
      // The `neutral` platform resolves strictly through `exports` maps by default. Some inlined
      // devDependencies (e.g. `rxjs-etc/operators`) only declare `module`/`main` fields, so
      // restore the conventional bundler fallback for them
      inputOptions: {
        resolve: {mainFields: ['module', 'main']},
        // The monorepo tsconfigs use `jsx: 'preserve'` (JSX is normally compiled by the studio's
        // Vite pipeline), which rolldown honors by emitting raw JSX into the bundle. Published
        // packages must ship plain JS, so always compile JSX with the automatic runtime here,
        // like `@sanity/pkg-utils` did
        transform: {jsx: {runtime: 'automatic'}},
      },
    }),
    overrides,
  )
}
