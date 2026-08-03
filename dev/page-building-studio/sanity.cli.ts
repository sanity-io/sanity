import {defineCliConfig} from 'sanity/cli'
import {mergeConfig, type UserConfig} from 'vite'

export default defineCliConfig({
  api: {
    projectId: 'ppsg7ml5',
    dataset: 'page-building',
  },
  reactCompiler: {target: '19'},
  vite(viteConfig: UserConfig): UserConfig {
    return mergeConfig(viteConfig, {
      // Aliasing to react-dom/profiling is necessary so React can run the profiler
      resolve: {alias: {'react-dom/client': require.resolve('react-dom/profiling')}},
      build: {
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
  },
})
