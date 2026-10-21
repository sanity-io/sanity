import {fileURLToPath} from 'node:url'

import {pandacss} from '@pandacss/vite'
import {removeCascadeLayers} from '@sanity/pandacss-tsdown-plugin/vite'
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineCliConfig} from 'sanity/cli'
import {defaultClientConditions, mergeConfig, type Plugin} from 'vite'

/** The `sanity` package: the repository's only Panda CSS project (packages/sanity/panda.config.ts). */
const SANITY_PACKAGE_DIR = fileURLToPath(new URL('../../packages/sanity/', import.meta.url))
/** Module ids of its sources (Vite ids use forward slashes on every platform). */
const RE_SANITY_PACKAGE_SOURCE = /\/packages\/sanity\/src\//
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
 * false` does for `bundle.css` (packages/sanity/tsdown.config.ts).
 */
function sanityPandaCss() {
  const pandaCssImport: Plugin = {
    name: 'test-studio:panda-css-import',
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

/**
 * `@sanity/vanilla-extract-vite-plugin` for the `.css.ts` modules of `@sanity/vision`, which
 * `sanity dev` resolves to source and which are still vanilla-extract. The plugin compiles every
 * `.css.ts` module of a build as vanilla-extract, so the `sanity` package's — Panda CSS, built by
 * `sanityPandaCss()` — are excluded from its transform's hook filter here. Throws rather than
 * failing open when the plugin's name or hook shape changes, so an upstream change shows up here
 * and not as vision compiling `sanity`'s modules. Both this wrapper and the plugin go once vision
 * moves to CSS modules (#15406).
 */
function visionVanillaExtract() {
  const plugins = vanillaExtractPlugin()
  const plugin = plugins.find((candidate) => candidate.name === 'sanity-vanilla-extract')
  const transform = plugin?.transform
  const include = typeof transform === 'object' ? transform.filter?.id : undefined
  if (!plugin || typeof transform !== 'object' || !(include instanceof RegExp)) {
    throw new Error(
      '@sanity/vanilla-extract-vite-plugin changed its plugin name or transform hook shape; update visionVanillaExtract() in sanity.cli.ts',
    )
  }
  return plugins.map((candidate) =>
    candidate === plugin
      ? {
          ...plugin,
          transform: {
            ...transform,
            filter: {...transform.filter, id: {include, exclude: RE_SANITY_PACKAGE_SOURCE}},
          },
        }
      : candidate,
  )
}

const isStaging = process.env.SANITY_INTERNAL_ENV == 'staging'
// Enables Vite DevTools (https://devtools.vite.dev) for both `sanity dev` and `sanity build`.
// During `sanity build` it records a Rolldown build session, which can then be inspected from
// the DevTools dock in a running `sanity dev` server without restarting it.
// Usage: `pnpm devtools:test-studio` from the repo root (see AGENTS.md).
const isViteDevToolsEnabled = process.env.ENABLE_VITE_DEVTOOLS === 'true'
// React DevTools profiling via agent-react-devtools. Usage: `pnpm react-devtools:test-studio` (see AGENTS.md).
const isReactDevtoolsEnabled = process.env.ENABLE_REACT_DEVTOOLS === 'true'

export default defineCliConfig({
  api: isStaging
    ? {
        projectId: 'exx11uqh',
        dataset: 'playground',
      }
    : {
        projectId: 'ppsg7ml5',
        dataset: 'test',
      },
  // Can be overriden by:
  // A) `SANITY_STUDIO_REACT_STRICT_MODE=false pnpm dev`
  // B) creating a `.env` file locally that sets the same env variable as above
  reactStrictMode: true,
  // Opt into Vite's experimental full-bundle (bundledDev) mode for `sanity dev`.
  // Bundles the app up front so late-discovered lazy import() targets no longer
  // trigger the monorepo "waterfall of reload doom", which previously required
  // server.warmup.clientFiles workarounds.
  // {@link https://vite.dev/guide/rolldown#full-bundle-mode}
  unstable_bundledDev: true,
  reactCompiler: {
    // `transform: 'oxc'` runs React Compiler through `oxc-transform-react` (the native Rust
    // port): one native pass handles React Compiler, TypeScript/JSX and Fast Refresh — no babel
    transform: 'oxc',
    target: '19',
    // By default the compiler runs on all workspace files, even sanity/lib/structure.js which is
    // pre-compiled with `tsdown`, and so we filter by just studio files. oxc `sources` are
    // substring filters (function filters can't cross the native boundary): the studio's own
    // files, plus workspace sources resolved via the `monorepo` condition during `sanity dev` —
    // pre-compiled output lives under `lib/`, never `src/`, so it can't match. node_modules is
    // already excluded by @vitejs/plugin-react's default `exclude` before the compiler runs.
    sources: ['dev/test-studio', '/sanity/src/', '/@sanity/vision/src/'],
  },
  async vite(viteConfig, {command, mode}) {
    const reactProductionProfiling = process.env.REACT_PRODUCTION_PROFILING === 'true'

    let nextConfig = mergeConfig(viteConfig, {
      // `sanity dev` resolves the workspace packages to their sources (the `monorepo` condition
      // below), so the Panda CSS `.css.ts` modules of `sanity` and the vanilla-extract ones of
      // `@sanity/vision` are built here; `sanity build` uses the built packages and their
      // `bundle.css`
      plugins: command === 'serve' ? [...visionVanillaExtract(), ...sanityPandaCss()] : [],
      // Needed due to the monorepo setup, optimizeDeps will cause duplication of context providers when it chunks lazy imports so we have to disable optimization
      optimizeDeps: {exclude: ['sanity']},
    })

    if (isViteDevToolsEnabled) {
      // Lazy import so the devtools package is only loaded when the flag is enabled
      const {DevTools} = await import('@vitejs/devtools')
      nextConfig = mergeConfig(nextConfig, {
        plugins: [DevTools()],
        // `devtools: {}` makes `sanity build` emit a Rolldown build session that the DevTools dock can inspect
        build: {rolldownOptions: {devtools: {}}},
      })
    }

    if (isReactDevtoolsEnabled) {
      const {reactDevtools} = await import('agent-react-devtools/vite')
      nextConfig = mergeConfig(nextConfig, {plugins: [reactDevtools()]})
    }

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
      })
    }

    // Support hot reloading of files from monorepo workspaces during development
    if (mode !== 'production' && command === 'serve') {
      return mergeConfig(nextConfig, {
        resolve: {conditions: ['monorepo', ...defaultClientConditions]},
      })
    }

    return nextConfig
  },
})
