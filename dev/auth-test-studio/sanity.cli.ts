import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineCliConfig} from 'sanity/cli'
import {defaultClientConditions, mergeConfig, type UserConfig} from 'vite'

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
      plugins: [vanillaExtractPlugin()],
      // Needed due to the monorepo setup, optimizeDeps will cause duplication of context providers when it chunks lazy imports so we have to disable optimization
      optimizeDeps: {exclude: ['sanity']},
      // bundledDev: shared chunks can run before the react-refresh preamble.
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
