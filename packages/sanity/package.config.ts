import {defineConfig} from '@sanity/pkg-utils'
import baseConfig from '../../package.config'

export default defineConfig({
  ...baseConfig,

  exports: (prevExports) => ({
    ...prevExports,

    // Build unexposed bundles for scripts that need to be spawned/used in workers
    './_internal/cli/threads/esbuild': {
      source: './src/_internal/cli/threads/esbuild.ts',
      require: './lib/_internal/cli/threads/esbuild.js',
      default: './lib/_internal/cli/threads/esbuild.js',
    },
    './_internal/cli/threads/registerBrowserEnv': {
      source: './src/_internal/cli/threads/registerBrowserEnv.ts',
      require: './lib/_internal/cli/threads/registerBrowserEnv.js',
      default: './lib/_internal/cli/threads/registerBrowserEnv.js',
    },
    './_internal/cli/threads/configClient': {
      source: './src/_internal/cli/threads/configClient.ts',
      require: './lib/_internal/cli/threads/configClient.js',
      default: './lib/_internal/cli/threads/configClient.js',
    },
    './_internal/cli/threads/getGraphQLAPIs': {
      source: './src/_internal/cli/threads/getGraphQLAPIs.ts',
      require: './lib/_internal/cli/threads/getGraphQLAPIs.js',
      default: './lib/_internal/cli/threads/getGraphQLAPIs.js',
    },
    './_internal/cli/threads/getSchemaDocumentTypeDefinitions': {
      source: './src/_internal/cli/threads/getSchemaDocumentTypeDefinitions.ts',
      require: './lib/_internal/cli/threads/getSchemaDocumentTypeDefinitions.js',
      default: './lib/_internal/cli/threads/getSchemaDocumentTypeDefinitions.js',
    },
  }),

  extract: {
    ...baseConfig.extract,
    rules: {
      ...baseConfig.extract?.rules,
      'ae-incompatible-release-tags': 'error',
      'ae-missing-release-tag': 'error',
    },
  },
})
