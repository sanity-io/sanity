import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineCliConfig} from 'sanity/cli'
import {defaultClientConditions, mergeConfig, type UserConfig} from 'vite'

const reactCompilerAllowList = /\/(?:sanity|@sanity\/vision)\/src\/.*\.tsx?$/

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
    target: '19',
    // By default the compiler is loaded up on all workspace files, even sanity/lib/structure.js which is pre-compiled with `tsdown`,
    // and so we filter by just studio files
    sources: (filename) => {
      // The default behavior is to always skip node_modules: https://github.com/facebook/react/blob/d6cae440e34c6250928e18bed4a16480f83ae18a/compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Options.ts#L326
      if (filename.indexOf('node_modules') !== -1) {
        return false
      }
      // Compile files in the test studio itself
      if (filename.indexOf('dev/starter-studio') !== -1) {
        return true
      }
      // If the file is `.ts` or `.tsx` then we should run the compiler (it's resolved with the `monorepo` condition during `sanity dev`)
      // otherwise it's likely resolving a built file that had react compiler already applied during its build process
      return reactCompilerAllowList.test(filename)
    },
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
