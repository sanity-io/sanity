import {defineConfig} from '@repo/test-config/vitest'

export default defineConfig({
  test: {
    // Pure helpers of the repo scripts (e.g. the Chrome launcher's environment allowlist); the
    // scripts themselves are exercised by running them
    include: ['./**/*.test.ts'],
    exclude: ['./node_modules/**', './**/node_modules/**'],
  },
})
