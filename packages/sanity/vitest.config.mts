import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {defineConfig} from '@repo/test-config/vitest'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'jsdom',
    globalSetup: ['./test/setup/global.ts'],
    setupFiles: ['./test/setup/environment.ts'],
    exclude: ['./playwright-ct', './src/_internal/cli'],
    server: {
      deps: {inline: ['vitest-package-exports']},
    },
    typecheck: {
      enabled: true,
      // @TODO we have a lot of TS errors to fix in test files before we can remove this line
      ignoreSourceErrors: true,
    },
  },
  plugins: [react({babel: {plugins: [['babel-plugin-react-compiler', {target: '19'}]]}})],
})
