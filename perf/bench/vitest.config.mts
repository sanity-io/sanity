import {defineConfig} from '@repo/test-config/vitest'
import {defaultServerConditions} from 'vite'

export default defineConfig({
  test: {
    include: ['./**/__tests__/**/*.test.ts'],
    exclude: ['./dist/**', './results/**', './node_modules/**'],
  },
  resolve: {
    // Resolve workspace packages (@sanity/mutator, @sanity/types) to their
    // TS source so the tests run without a prior build — same condition the
    // CLI's tsx invocations use (see package.json scripts)
    conditions: ['monorepo', ...defaultServerConditions],
  },
})
