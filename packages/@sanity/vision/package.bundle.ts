import {createDefaultConfig} from '@repo/package.bundle'
import {defineConfig, mergeConfig} from 'vite'

import pkg from './package.json' with {type: 'json'}

export default defineConfig(() => {
  return mergeConfig(createDefaultConfig({version: pkg.version}), {
    build: {
      lib: {
        entry: {
          index: './src/index.ts',
        },
      },
    },
  })
})
