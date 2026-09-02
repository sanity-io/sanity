import {defineConfig} from '@repo/test-config/vitest'

export default defineConfig({
  test: {
    // Playwright specs live in tests/*.spec.ts — keep them out of vitest.
    include: ['./reporters/**/*.test.ts'],
    exclude: ['./node_modules/**', './results/**', './tests/**'],
  },
})
