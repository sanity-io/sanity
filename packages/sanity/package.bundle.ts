import {createDefaultConfig} from '@repo/package.bundle'
import {defineConfig, mergeConfig} from 'vite'

import pkg from './package.json' with {type: 'json'}

export default defineConfig(() => {
  return mergeConfig(createDefaultConfig({version: pkg.version}), {
    build: {
      lib: {
        entry: {
          '_singletons': './src/_exports/_singletons.ts',
          '_createContext': './src/_exports/_createContext.ts',
          // 'sanity' module
          'index': './src/_exports/index.ts',
          'desk': './src/_exports/desk.ts',
          'media-library': './src/_exports/media-library.ts',
          'presentation': './src/_exports/presentation.ts',
          'router': './src/_exports/router.ts',
          'structure': './src/_exports/structure.ts',
        },
      },
    },
  })
})
