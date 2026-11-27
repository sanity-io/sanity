import {createDefaultConfig} from '@repo/package.bundle'
import {defineConfig, mergeConfig} from 'vite'

import pkg from './package.json' with {type: 'json'}

export default defineConfig(() => {
  const {version, browserslist} = pkg
  return mergeConfig(createDefaultConfig({version, browserslist, styles: 'css-modules'}), {
    build: {
      lib: {
        entry: {
          index: './src/index.ts',
        },
      },
    },
  })
})
