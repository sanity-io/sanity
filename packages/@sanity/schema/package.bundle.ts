import {defineConfig, mergeConfig} from 'vite'

import {defaultConfig} from '../../@repo/package.bundle/src/package.bundle'

export default defineConfig(() => {
  return mergeConfig(defaultConfig, {
    build: {
      lib: {
        entry: {
          '@sanity__schema': './src/_exports/index.ts',
          '@sanity__schema_internal': './src/_exports/_internal.ts',
        },
      },
    },
  })
})
