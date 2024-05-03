import {defineConfig, mergeConfig} from 'vite'

import {defaultConfig} from '../../@repo/package.bundle/src/package.bundle'

export default defineConfig(() => {
  return mergeConfig(defaultConfig, {
    build: {
      lib: {
        entry: {
          '@sanity__portable-text-editor': './src/index.ts',
        },
      },
      rollupOptions: {
        external: ['@sanity/block-tools', '@sanity/schema', '@sanity/util'],
      },
    },
  })
})
