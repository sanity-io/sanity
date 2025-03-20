import {defineConfig, mergeConfig} from 'vite'

import {defaultConfig} from '../@repo/package.bundle/src/package.bundle'

export default defineConfig(() => {
  return mergeConfig(defaultConfig, {
    build: {
      lib: {
        entry: {
          '_singletons': './src/_exports/_singletons.ts',
          '_createContext': './src/_exports/_createContext.ts',
          // 'sanity' module
          'index': './src/_exports/index.ts',
          'desk': './src/_exports/desk.ts',
          'presentation': './src/_exports/presentation.ts',
          'router': './src/_exports/router.ts',
          'structure': './src/_exports/structure.ts',
          'ui-components': './src/_exports/ui-components.ts',
        },
      },
    },
  })
})
