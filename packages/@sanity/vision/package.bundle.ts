import {viteCssModules} from '@repo/css-modules-kit'
import {createDefaultConfig} from '@repo/package.bundle'
import {defineConfig, mergeConfig} from 'vite'

import pkg from './package.json' with {type: 'json'}

export default defineConfig(() => {
  return mergeConfig(createDefaultConfig({version: pkg.version}), {
    // The CDN bundle compiles the CSS modules from source, like the package build does
    // (`tsdown.config.ts`), so it gets the same Lightning CSS scoping and class names. The merge
    // keeps the shared config's `lightningcss.exclude`
    css: viteCssModules,
    build: {
      lib: {
        entry: {
          index: './src/index.ts',
        },
      },
    },
  })
})
