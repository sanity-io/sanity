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
    './_internal/cli/threads/validateDocuments': {
      source: './src/_internal/cli/threads/validateDocuments.ts',
      require: './lib/_internal/cli/threads/validateDocuments.js',
      default: './lib/_internal/cli/threads/validateDocuments.js',
    },
    './_internal/cli/threads/validateSchema': {
      source: './src/_internal/cli/threads/validateSchema.ts',
      require: './lib/_internal/cli/threads/validateSchema.js',
      default: './lib/_internal/cli/threads/validateSchema.js',
    },
    './_internal/cli/threads/extractSchema': {
      source: './src/_internal/cli/threads/extractSchema.ts',
      require: './lib/_internal/cli/threads/extractSchema.js',
      default: './lib/_internal/cli/threads/extractSchema.js',
    },
    './_internal/cli/threads/typegenGenerate': {
      source: './src/_internal/cli/threads/typegenGenerate.ts',
      require: './lib/_internal/cli/threads/typegenGenerate.js',
      default: './lib/_internal/cli/threads/typegenGenerate.js',
    },
  }),

  extract: {
    ...baseConfig.extract,
    rules: {
      ...baseConfig.extract?.rules,
      'ae-incompatible-release-tags': 'warn',
      'ae-missing-release-tag': 'warn',
    },
  },
})
