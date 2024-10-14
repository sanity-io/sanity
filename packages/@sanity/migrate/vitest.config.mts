import {defineConfig} from '@repo/test-config/vitest'

export default defineConfig({
  test: {
    includeSource: ['./src/**/*.ts'],
  },
})
