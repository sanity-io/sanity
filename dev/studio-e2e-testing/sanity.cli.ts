import {loadEnvFiles} from '@repo/utils'
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineCliConfig} from 'sanity/cli'

loadEnvFiles()

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_E2E_PROJECT_ID,
    dataset: process.env.SANITY_E2E_DATASET,
  },
  // React Compiler on `oxc-transform-react` (no babel), see dev/test-studio/sanity.cli.ts
  reactCompiler: {transform: 'oxc', target: '19'},
  vite: {
    // The shared sanity-test-studio schema and plugins ship .css.ts files, so this studio needs the
    // same vanilla-extract plugin as dev/test-studio to build them
    plugins: [vanillaExtractPlugin()],
    define: {
      'process.env.SANITY_E2E_PROJECT_ID': JSON.stringify(process.env.SANITY_E2E_PROJECT_ID),
      'process.env.SANITY_E2E_DATASET': JSON.stringify(process.env.SANITY_E2E_DATASET),
      'process.env.SANITY_E2E_DATASET_CHROMIUM': JSON.stringify(
        process.env.SANITY_E2E_DATASET_CHROMIUM,
      ),
      'process.env.SANITY_E2E_DATASET_FIREFOX': JSON.stringify(
        process.env.SANITY_E2E_DATASET_FIREFOX,
      ),
    },
    // Allows running React Profiler and better debugging
    resolve: {alias: {'react-dom/client': require.resolve('react-dom/profiling')}},
    build: {
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
  },
})
