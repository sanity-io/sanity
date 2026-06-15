import {defineConfig} from '@repo/test-config/vitest'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    typecheck: {
      enabled: true,
      ignoreSourceErrors: false,
    },
  },
  plugins: [viteReact()],
})
