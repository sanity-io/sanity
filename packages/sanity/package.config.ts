import baseConfig from '@repo/package.config'
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  ...baseConfig,

  // Build unexposed bundles for scripts that need to be spawned/used in workers
  bundles: [
    {
      source: './src/_internal/cli/threads/esbuild.ts',
      require: './lib/_internal/cli/threads/esbuild.cjs',
      runtime: 'node',
    },
    {
      source: './src/_internal/cli/threads/registerBrowserEnv.ts',
      require: './lib/_internal/cli/threads/registerBrowserEnv.cjs',
      runtime: 'node',
    },
    {
      source: './src/_internal/cli/threads/configClient.ts',
      require: './lib/_internal/cli/threads/configClient.cjs',
      runtime: 'node',
    },
    {
      source: './src/_internal/cli/threads/getGraphQLAPIs.ts',
      require: './lib/_internal/cli/threads/getGraphQLAPIs.cjs',
      runtime: 'node',
    },
    {
      source: './src/_internal/cli/threads/validateDocuments.ts',
      require: './lib/_internal/cli/threads/validateDocuments.cjs',
      runtime: 'node',
    },
    {
      source: './src/_internal/cli/threads/validateSchema.ts',
      require: './lib/_internal/cli/threads/validateSchema.cjs',
      runtime: 'node',
    },
    {
      source: './src/_internal/cli/threads/extractSchema.ts',
      require: './lib/_internal/cli/threads/extractSchema.cjs',
      runtime: 'node',
    },
    {
      source: './src/_internal/cli/threads/extractManifest.ts',
      require: './lib/_internal/cli/threads/extractManifest.cjs',
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
