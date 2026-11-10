import {defineConfig} from '@repo/test-config/vitest'

export default defineConfig({
  test: {
    // The pure trend-math modules (drift detection, ack expiry) and the
    // git-history parsers and the SQRL engine — the UI itself is exercised via
    // the debug data sources, not unit tests
    include: ['./tools/**/*.test.ts', './scripts/**/*.test.ts', './sqrl/**/*.test.ts'],
    exclude: ['./dist/**', './node_modules/**'],
  },
})
