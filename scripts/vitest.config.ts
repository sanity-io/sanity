import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    include: ['__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    environment: 'node',
    typecheck: {
      include: ['**/*.{ts,tsx,mts}'],
    },
  },
})
