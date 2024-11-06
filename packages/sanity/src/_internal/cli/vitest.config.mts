import {defineConfig} from '@repo/test-config/vitest'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // @ts-expect-error vite typings error
  plugins: [react()],
  test: {
    environment: 'node',
    includeSource: ['./**/*.ts'],
    env: {
      FORCE_COLOR: '0',
    },
  },
})
