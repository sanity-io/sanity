import {defineConfig} from '@repo/test-config/vitest'

export default defineConfig({
  test: {
    // Unit tests for the reporters and the flake-report tooling. Playwright specs
    // live in tests/*.spec.ts and run through `playwright test`, never vitest.
    include: ['./reporters/**/*.test.ts', './scripts/**/*.test.ts'],
    exclude: ['./node_modules/**', './results/**', './tests/**'],
  },
})
