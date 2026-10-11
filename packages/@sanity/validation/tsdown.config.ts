import {defineConfig} from '@repo/tsdown.config'

export default defineConfig({
  entry: ['./src/index.ts', './src/_internal.ts'],
})
