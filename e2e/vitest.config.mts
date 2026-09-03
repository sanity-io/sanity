import {defineConfig} from '@repo/test-config/vitest'

export default defineConfig({
  test: {
    // Unit tests for the flake-report tooling only. Playwright specs under ./tests
    // run through `playwright test`, never through vitest.
    include: ['./scripts/**/*.test.ts'],
    exclude: ['./node_modules/**', './tests/**'],
  },
})
