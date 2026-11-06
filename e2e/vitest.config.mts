import {defineConfig} from '@repo/test-config/vitest'

export default defineConfig({
  test: {
    // Unit tests for global setup, the reporters, the flake-report tooling and the spec helpers.
    // Playwright specs live in tests/*.spec.ts and run through `playwright test`, never vitest.
    include: [
      './*.test.ts',
      './reporters/**/*.test.ts',
      './scripts/**/*.test.ts',
      './helpers/**/*.test.ts',
    ],
    exclude: ['./node_modules/**', './results/**', './tests/**'],
  },
})
