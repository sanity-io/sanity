import babel from '@rolldown/plugin-babel'
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import viteReact, {reactCompilerPreset} from '@vitejs/plugin-react'
import {playwright} from '@vitest/browser-playwright'
import {defaultClientConditions, defineConfig} from 'vite'

import {readFileAsBase64} from './test/browser/commands'

const ALL_BROWSERS = ['chromium', 'firefox', 'webkit'] as const

// CI shards by browser (one runner each) to avoid contention. Set
// SANITY_VITEST_BROWSER to a single browser name to run only that instance;
// unset runs all three (the default for local runs).
const selectedBrowser = process.env.SANITY_VITEST_BROWSER
const browsers = selectedBrowser
  ? ALL_BROWSERS.filter((name) => name === selectedBrowser)
  : ALL_BROWSERS

if (selectedBrowser && browsers.length === 0) {
  throw new Error(
    `Invalid SANITY_VITEST_BROWSER="${selectedBrowser}". Expected one of: ${ALL_BROWSERS.join(', ')}`,
  )
}

export default defineConfig({
  plugins: [
    vanillaExtractPlugin(),
    viteReact(),
    babel({presets: [reactCompilerPreset({target: '19'})]}),
  ],
  resolve: {
    conditions: ['monorepo', ...defaultClientConditions],
    dedupe: ['react', 'react-dom', 'sanity', 'styled-components'],
  },
  test: {
    name: 'sanity-browser',
    include: ['./src/**/*.browser.test.{ts,tsx}'],
    // Browser tests are slower and flakier than jsdom tests, especially on
    // WebKit/Firefox in CI where all three browsers share one runner. Give
    // them generous timeouts and retry once (the old Playwright CT setup used
    // `retries: 1`).
    testTimeout: 30_000,
    retry: 1,
    // Element matchers (`expect.element(...).toBeVisible()`, `expect.poll`)
    // retry until this timeout; the default (~1s) is too tight for a loaded
    // CI runner running three browsers at once.
    expect: {poll: {timeout: 10_000}},
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      commands: {readFileAsBase64},
      // Desktop viewport so the Portable Text toolbar renders all buttons
      // instead of collapsing them into an overflow menu (matches the old
      // Playwright "Desktop" device presets).
      viewport: {width: 1280, height: 900},
      instances: browsers.map((browser) => ({browser})),
    },
    setupFiles: ['./test/setup/browser.ts'],
    typecheck: {
      enabled: true,
      ignoreSourceErrors: true,
    },
  },
})
