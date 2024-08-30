import {defineConfig, mergeConfig} from 'vite'

import {defaultConfig} from '../@repo/package.bundle/src/package.bundle'

export default defineConfig(() => {
  return mergeConfig(defaultConfig, {
    define: {
      'window.process': 'undefined',
      'window.location': 'location',
      'window.console': 'console',
      'window.addEventListener': 'addEventListener',
    },
    build: {
      lib: {
        entry: './src/core/store/_legacy/document/document-pair/checkoutPairWorker.ts',
        fileName: 'checkoutPair',
      },
      rollupOptions: {
        external: [],
        output: {
          exports: 'none',
          dir: 'web-workers',
          format: 'iife',
          inlineDynamicImports: true,
        },
      },
    },
    worker: {
      format: 'iife',
    },
  })
})
