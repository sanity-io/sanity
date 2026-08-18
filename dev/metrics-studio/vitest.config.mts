import {defineConfig} from '@repo/test-config/vitest'

export default defineConfig({
  test: {
    // The pure trend-math modules (drift detection, ack expiry) — the UI
    // itself is exercised via the debug data sources, not unit tests
    include: ['./tools/**/*.test.ts'],
    exclude: ['./dist/**', './node_modules/**'],
  },
})
