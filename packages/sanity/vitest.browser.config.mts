import {playwright} from '@vitest/browser-playwright'
import react from '@vitejs/plugin-react'
import {defaultClientConditions, defineConfig} from 'vite'

import {readFileAsBase64} from './test/browser/commands'

export default defineConfig({
  plugins: [
    react({
      babel: {plugins: [['babel-plugin-react-compiler', {target: '19'}]]},
    }),
  ],
  resolve: {
    conditions: ['monorepo', ...defaultClientConditions],
    dedupe: ['react', 'react-dom', 'sanity', 'styled-components'],
  },
  test: {
    name: 'sanity-browser',
    include: ['./src/**/*.browser.test.{ts,tsx}'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      commands: {readFileAsBase64},
      instances: [
        {browser: 'chromium'},
        {browser: 'firefox'},
        {browser: 'webkit'},
      ],
    },
    setupFiles: ['./test/setup/browser.ts'],
    typecheck: {
      enabled: true,
      ignoreSourceErrors: true,
    },
  },
})
