import {defaultConfig} from '@repo/package.bundle'
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin'
import {defineConfig, mergeConfig} from 'vite'

export default defineConfig(() => {
  return mergeConfig(defaultConfig, {
    plugins: [vanillaExtractPlugin()],
    build: {
      lib: {
        entry: {
          index: './src/index.ts',
        },
      },
    },
  })
})
