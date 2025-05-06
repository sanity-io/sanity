import {defineConfig} from '@repo/test-config/vitest'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    typecheck: {
      enabled: true,
      ignoreSourceErrors: false,
    },
  },
  plugins: [react({babel: {plugins: [['babel-plugin-react-compiler', {target: '18'}]]}})],
})
