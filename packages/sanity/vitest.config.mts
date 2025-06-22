import path from 'node:path'

import {defineConfig} from '@repo/test-config/vitest'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        useAtomics: true,
      },
    },
    environment: 'jsdom',
    globalSetup: ['./test/setup/global.ts'],
    setupFiles: ['./test/setup/environment.ts'],
    exclude: ['./playwright-ct', './src/_internal/cli'],
    server: {
      deps: {inline: ['vitest-package-exports']},
    },
    /**
     * Portabletext package depends on monorepo packages that are not necessarily the same version
     * as the latest sanity packages. pnpm dedupes this packages so the aliases do not work in this case.
     * This alias points to the source of the pte package so the aliases work.
     */
    alias: {
      '@portabletext/block-tools': path.join(
        __dirname,
        './node_modules/@portabletext/block-tools/src',
      ),
      '@portabletext/editor': path.join(__dirname, './node_modules/@portabletext/editor/src'),
    },
    typecheck: {
      enabled: true,
      // @TODO we have a lot of TS errors to fix in test files before we can remove this line
      ignoreSourceErrors: true,
    },
  },
  plugins: [react({babel: {plugins: [['babel-plugin-react-compiler', {target: '18'}]]}})],
})
