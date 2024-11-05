import {defineConfig} from '@repo/test-config/vitest'

export default defineConfig({
  test: {
    includeSource: ['./runner/__tests__/**/*.ts'],
    exclude: ['./tests'],
  },
})
