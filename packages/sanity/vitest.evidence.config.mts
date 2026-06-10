import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import {playwright} from '@vitest/browser-playwright'
import {defaultClientConditions, defineConfig} from 'vite'

/**
 * Standalone browser-mode config for `*.evidence.tsx` visual-evidence stories
 * (driven by scripts/visual-evidence.mjs). Kept self-contained — not extending
 * vitest.browser.config.mts — so the harness can run against any branch, including
 * ones that predate the browser test suite, as long as deps are installed.
 *
 * Evidence stories render a component in real headless Chromium and screenshot it;
 * they are not part of the assertion suite (their `.evidence.tsx` suffix keeps them
 * out of the normal `test:browser` glob).
 */
const selectedBrowser = process.env.SANITY_VITEST_BROWSER || 'chromium'

export default defineConfig({
  plugins: [
    vanillaExtractPlugin(),
    react({babel: {plugins: [['babel-plugin-react-compiler', {target: '19'}]]}}),
  ],
  resolve: {
    conditions: ['monorepo', ...defaultClientConditions],
    dedupe: ['react', 'react-dom', 'sanity', 'styled-components'],
  },
  test: {
    name: 'sanity-evidence',
    include: ['./src/**/*.evidence.tsx'],
    testTimeout: 60_000,
    expect: {poll: {timeout: 10_000}},
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      viewport: {width: 1280, height: 900},
      instances: [{browser: selectedBrowser}],
    },
  },
})
