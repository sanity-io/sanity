import {loadEnvFiles} from '@repo/utils'
import {defineCliConfig} from 'sanity/cli'

loadEnvFiles()

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_E2E_PROJECT_ID,
    dataset: process.env.SANITY_E2E_DATASET,
  },
  reactCompiler: {target: '19'},
  vite: {
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
    esbuild: {minifyIdentifiers: false},
    build: {sourcemap: true},
  },
})
