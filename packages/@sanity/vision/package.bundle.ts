import {defineConfig, mergeConfig} from 'vite'

import {defaultConfig} from '../../@repo/package.bundle/src/package.bundle'

export default defineConfig(() => {
  return mergeConfig(defaultConfig, {
    build: {
      lib: {
        entry: {
          '@sanity__vision': './src/index.ts',
        },
      },
      rollupOptions: {
        external: ['sanity'],
      },
    },
  })
})
