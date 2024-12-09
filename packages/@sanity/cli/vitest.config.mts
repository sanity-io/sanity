import {defineConfig} from '@repo/test-config/vitest'

export default defineConfig({
  test: {
    includeSource: ['./test/**/*.ts'],
    globalSetup: ['./test/shared/globalSetup.ts'],
    testTimeout: 30000, // 30s
  },
})
