import {defineConfig} from '@repo/test-config/vitest'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({babel: {plugins: [['babel-plugin-react-compiler', {target: '18'}]]}})],
  test: {
    environment: 'node',
    includeSource: ['./**/*.ts'],
    env: {
      FORCE_COLOR: '0',
    },
  },
})
