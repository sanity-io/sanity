import {defineConfig, mergeConfig} from 'vite'

import {defaultConfig} from '../../@repo/package.bundle/src/package.bundle'

export default defineConfig(() => {
  return mergeConfig(defaultConfig, {
    build: {
      lib: {
        entry: {
          '@sanity__util': './src/_exports/index.ts',
          '@sanity__util_client': './src/_exports/client.ts',
          '@sanity__util_content': './src/_exports/content.ts',
          '@sanity__util_concurrency-limiter': './src/_exports/concurrency-limiter.ts',
          '@sanity__util_createSafeJsonParser': './src/_exports/createSafeJsonParser.ts',
          '@sanity__util_legacyDateFormat': './src/_exports/legacyDateFormat.ts',
          '@sanity__util_paths': './src/_exports/paths.ts',
        },
      },
    },
  })
})
