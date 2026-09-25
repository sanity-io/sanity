import {defineConfig} from '@repo/test-config/vitest'

export default defineConfig({
  test: {
    // The style widget's corner math — pure modules, plain node environment. The
    // studio and its plugins are otherwise exercised by running it.
    include: ['./plugins/**/*.test.ts'],
    exclude: ['./dist/**', './node_modules/**'],
  },
})
