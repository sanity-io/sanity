import {defineConfig} from '@sanity/pkg-utils'
import baseConfig from '../../package.config'

export default defineConfig({
  ...baseConfig,

  exports: (prevExports) => ({
    ...prevExports,

    // Build unexposed bundles for scripts that need to be spawned/used in workers
    './cli/threads/esbuild': {
      source: './src/cli/threads/esbuild.ts',
      require: './lib/cli/threads/esbuild.js',
      default: './lib/cli/threads/esbuild.js',
    },
    './cli/threads/registerBrowserEnv': {
      source: './src/cli/threads/registerBrowserEnv.ts',
      require: './lib/cli/threads/registerBrowserEnv.js',
      default: './lib/cli/threads/registerBrowserEnv.js',
    },
    './cli/threads/configClient': {
      source: './src/cli/threads/configClient.ts',
      require: './lib/cli/threads/configClient.js',
      default: './lib/cli/threads/configClient.js',
    },
    './cli/threads/getGraphQLAPIs': {
      source: './src/cli/threads/getGraphQLAPIs.ts',
      require: './lib/cli/threads/getGraphQLAPIs.js',
      default: './lib/cli/threads/getGraphQLAPIs.js',
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
