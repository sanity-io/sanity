import baseConfig from '@repo/package.config'
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  ...baseConfig,

  // Build unexposed bundles for scripts that need to be spawned/used in workers
  bundles: [
    {
      source: './src/_internal/cli/threads/esbuild.ts',
      import: './lib/_internal/cli/threads/esbuild.js',
      runtime: 'node',
    },
    {
      source: './src/_internal/cli/threads/registerBrowserEnv.ts',
      import: './lib/_internal/cli/threads/registerBrowserEnv.js',
      runtime: 'node',
    },
    {
      source: './src/_internal/cli/threads/configClient.ts',
      import: './lib/_internal/cli/threads/configClient.js',
      runtime: 'node',
    },
    {
      source: './src/_internal/cli/threads/getGraphQLAPIs.ts',
      import: './lib/_internal/cli/threads/getGraphQLAPIs.js',
      runtime: 'node',
    },
    {
      source: './src/_internal/cli/threads/validateDocuments.ts',
      import: './lib/_internal/cli/threads/validateDocuments.js',
      runtime: 'node',
    },
    {
      source: './src/_internal/cli/threads/validateSchema.ts',
      import: './lib/_internal/cli/threads/validateSchema.js',
      runtime: 'node',
    },
    {
      source: './src/_internal/cli/threads/extractSchema.ts',
      import: './lib/_internal/cli/threads/extractSchema.js',
      runtime: 'node',
    },
    {
      source: './src/_internal/cli/threads/extractManifest.ts',
      import: './lib/_internal/cli/threads/extractManifest.js',
      runtime: 'node',
    },
  ],

  extract: {
    ...baseConfig.extract,
    rules: {
      ...baseConfig.extract.rules,
      'ae-incompatible-release-tags': 'error',
      'ae-missing-release-tag': 'error',
    },
  },

  babel: {reactCompiler: true},
  reactCompilerOptions: {target: '18'},
})
