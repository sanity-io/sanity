import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineCliConfig} from 'sanity/cli'
import {defaultClientConditions, mergeConfig} from 'vite'

const isStaging = process.env.SANITY_INTERNAL_ENV == 'staging'
// Enables Vite DevTools (https://devtools.vite.dev) for both `sanity dev` and `sanity build`.
// During `sanity build` it records a Rolldown build session, which can then be inspected from
// the DevTools dock in a running `sanity dev` server without restarting it.
// Usage: `pnpm devtools:test-studio` from the repo root (see AGENTS.md).
const isViteDevToolsEnabled = process.env.ENABLE_VITE_DEVTOOLS === 'true'

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
      plugins: [vanillaExtractPlugin()],
      // Needed due to the monorepo setup, optimizeDeps will cause duplication of context providers when it chunks lazy imports so we have to disable optimization
      optimizeDeps: {exclude: ['sanity']},
      // With experimental.bundledDev, shared chunks can evaluate before the entry
      // chunk's react-refresh preamble, causing:
      // "@vitejs/plugin-react can't detect preamble". Force entry-first order.
      // See https://github.com/vitejs/vite-plugin-react/issues/1191
      ...(command === 'serve'
        ? {
            build: {
              rolldownOptions: {
                output: {strictExecutionOrder: true},
              },
            },
          }
        : {}),
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
