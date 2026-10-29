import {defineConfig} from '@repo/tsdown.config'

export default defineConfig({
  entry: './src/index.ts',
  // Also wipe coverage output (a string[] replaces the shared `clean: ['lib']` default, so `lib`
  // must be listed explicitly)
  clean: ['lib', 'coverage'],
})
