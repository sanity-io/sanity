import {defineConfig} from '@repo/test-config/vitest'

export default defineConfig({
  test: {
    include: ['./scripts/**/*.test.ts'],
    exclude: ['./node_modules/**', './reports/**'],
    environment: 'node',
  },
})
