import {defineConfig} from '@repo/test-config/vitest'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
  },
})
