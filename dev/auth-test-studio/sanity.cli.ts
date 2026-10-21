import {fileURLToPath} from 'node:url'

import {pandacss} from '@pandacss/vite'
import {removeCascadeLayers} from '@sanity/pandacss-tsdown-plugin/vite'
import {defineCliConfig} from 'sanity/cli'
import {defaultClientConditions, mergeConfig, type Plugin, type UserConfig} from 'vite'

/** The `sanity` package: the repository's only Panda CSS project (packages/sanity/panda.config.ts). */
const SANITY_PACKAGE_DIR = fileURLToPath(new URL('../../packages/sanity/', import.meta.url))
/** The entry `sanity dev` and `sanity build` write for a studio. */
const RE_STUDIO_RUNTIME_ENTRY = /[\\/]\.sanity[\\/]runtime[\\/]app\.js$/
/** The stylesheet `@pandacss/vite` fills, see `sanityPandaCss()`. */
const PANDA_CSS = fileURLToPath(new URL('./panda.css', import.meta.url))

/**
 * Builds the `sanity` package's Panda CSS from source: `sanity dev` resolves the workspace packages
 * to their sources (the `monorepo` condition below), so the package's `.css.ts` modules are built
 * here, while `sanity build` resolves the built package and the `bundle.css` it imports. The
 * `@pandacss/vite` instance points at the package's Panda project: it rewrites the `css()` calls to
 * class names and generates their CSS into `panda.css`, which the last plugin imports from the studio
 * runtime entry — the counterpart of the built package's `sanity/bundle.css` import.
 * `removeCascadeLayers()` takes Panda's cascade layers out of that CSS again, as `cascadeLayers:
 * false` does for `bundle.css` (packages/sanity/tsdown.config.ts). Same setup as dev/test-studio.
 */
function sanityPandaCss() {
  const pandaCssImport: Plugin = {
    name: 'auth-test-studio:panda-css-import',
    transform: {
      filter: {id: RE_STUDIO_RUNTIME_ENTRY},
      handler: (code) => ({code: `import ${JSON.stringify(PANDA_CSS)}\n${code}`, map: null}),
    },
  }
  // No return type: `vite` resolves to one copy for this studio and to another for the plugins
  // (two peer variants in the lockfile), whose `Plugin` types are not interchangeable
  return [
    pandacss({cwd: SANITY_PACKAGE_DIR, transform: true}),
    removeCascadeLayers(['reset', 'base', 'tokens', 'recipes', 'utilities']),
    pandaCssImport,
  ]
}

export default defineCliConfig({
  api: {
    projectId: 'ppsg7ml5',
    dataset: 'test',
  },
  // Can be overriden by:
  // A) `SANITY_STUDIO_REACT_STRICT_MODE=false pnpm dev`
  // B) creating a `.env` file locally that sets the same env variable as above
  reactStrictMode: true,
  // Opt into Vite's experimental full-bundle mode so late-discovered lazy
  // import() targets no longer need server.warmup.clientFiles workarounds.
  // {@link https://vite.dev/guide/rolldown#full-bundle-mode}
  unstable_bundledDev: true,
  reactCompiler: {
    // React Compiler on `oxc-transform-react` (no babel), see dev/test-studio/sanity.cli.ts
    transform: 'oxc',
    target: '19',
    // By default the compiler runs on all workspace files, even sanity/lib/structure.js which is
    // pre-compiled with `tsdown`, and so we filter by just studio files (substring filters; the
    // `monorepo` condition resolves workspace sources under `src/` during `sanity dev`)
    sources: ['dev/auth-test-studio', '/sanity/src/', '/@sanity/vision/src/'],
  },
  vite(viteConfig: UserConfig, {command, mode}): UserConfig {
    const reactProductionProfiling = process.env.REACT_PRODUCTION_PROFILING === 'true'

    const nextConfig = mergeConfig(viteConfig, {
      plugins: command === 'serve' ? sanityPandaCss() : [],
      // Needed due to the monorepo setup, optimizeDeps will cause duplication of context providers when it chunks lazy imports so we have to disable optimization
      optimizeDeps: {exclude: ['sanity']},
    } satisfies UserConfig)

    // Support React Production Profiling on deployed studios
    if (reactProductionProfiling && command === 'build') {
      return mergeConfig(nextConfig, {
        // Aliasing to react-dom/profiling is necessary in the production build, otherwise React can't run the profiler on the deployed studio
        resolve: {alias: {'react-dom/client': require.resolve('react-dom/profiling')}},
        build: {
          // Enable production source maps to easier debug deployed test studios
          sourcemap: true,
          rolldownOptions: {
            output: {
              // Disabling `mangle` (while keeping compression and whitespace removal) ensures that
              // the React DevTools components inspector has readable component names.
              // This overrides the `build.minify: 'oxc'` default set by `sanity build`, replacing
              // `esbuild: {minifyIdentifiers: false}` which the rolldown-powered Vite silently ignores.
              minify: {compress: true, mangle: false, codegen: true},
            },
          },
        },
      } satisfies UserConfig)
    }

    // Support hot reloading of files from monorepo workspaces during development
    if (mode !== 'production' && command === 'serve') {
      return mergeConfig(nextConfig, {
        resolve: {conditions: ['monorepo', ...defaultClientConditions]},
      } satisfies UserConfig)
    }

    return nextConfig
  },
})
