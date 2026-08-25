import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'ppsg7ml5',
    dataset: 'page-building',
  },
  // React Compiler on `oxc-transform-react` (no babel), see dev/test-studio/sanity.cli.ts
  reactCompiler: {transform: 'oxc', target: '19'},
  vite: {
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
  },
})
