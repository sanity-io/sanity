import {chromaticPlugin} from '@chromatic-com/vitest/plugin'
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import viteReact from '@vitejs/plugin-react'
import {playwright} from '@vitest/browser-playwright'
import {defaultClientConditions, defineConfig} from 'vite'

import {readFileAsBase64} from './test/browser/commands'

const ALL_BROWSERS = ['chromium', 'firefox', 'webkit'] as const

// Chromatic visual regression. The @chromatic-com/vitest plugin is always
// registered so that `configure()` / `takeSnapshot()` from
// '@chromatic-com/vitest' work in any test file (`takeSnapshot()` throws in a
// chromium test the plugin is not registered for; both are no-ops on firefox
// and webkit). Capturing is opt-in: with CHROMATIC=1 the plugin archives each
// test's end state while the suite runs, for upload to the "sanity studio
// vitest" Chromatic project via `chromatic --vitest` (see
// .github/workflows/chromatic.yml). This is the visual snapshot source for the
// browser tests — their harness components live inside the test files and
// are not re-exported as Storybook stories. Without the flag no automatic
// snapshots are taken, no TurboSnap stats are written, the plugin's reporter
// stays quiet and Chromatic's anonymous telemetry is off; only an explicit
// `takeSnapshot()` still writes an archive (gitignored, never uploaded).
// Chromatic re-renders archives in its own standardized cloud browser, so
// capture runs are chromium-only — capturing from firefox/webkit would only
// multiply identical archives.
const chromaticEnabled = Boolean(process.env.CHROMATIC)
if (!chromaticEnabled) {
  // Read by the plugin when it is constructed below.
  process.env.CHROMATIC_DISABLE_TELEMETRY ??= '1'
}

// CI shards by browser (one runner each) to avoid contention. Set
// SANITY_VITEST_BROWSER to a single browser name to run only that instance;
// unset runs all three (the default for local runs) — except for Chromatic
// capture runs, which default to chromium.
const selectedBrowser =
  process.env.SANITY_VITEST_BROWSER ?? (chromaticEnabled ? 'chromium' : undefined)
const browsers = selectedBrowser
  ? ALL_BROWSERS.filter((name) => name === selectedBrowser)
  : ALL_BROWSERS

if (selectedBrowser && browsers.length === 0) {
  throw new Error(
    `Invalid SANITY_VITEST_BROWSER="${selectedBrowser}". Expected one of: ${ALL_BROWSERS.join(', ')}`,
  )
}

if (chromaticEnabled && selectedBrowser !== 'chromium') {
  throw new Error(
    `CHROMATIC=1 captures archives from chromium only; unset SANITY_VITEST_BROWSER or set it to "chromium" (got "${selectedBrowser}").`,
  )
}

export default defineConfig({
  plugins: [
    vanillaExtractPlugin(),
    // `compiler` runs React Compiler through `oxc-transform-react`, in the same native pass
    // as the TypeScript/JSX transform (no babel in the pipeline)
    viteReact({compiler: {target: '19'}}),
    chromaticPlugin({
      // Every test's end state is a snapshot on capture runs; tests opt out
      // with `configure({disableAutoSnapshot: true})`.
      disableAutoSnapshot: !chromaticEnabled,
      // `turboSnap` writes `preview-stats.json` (the Vite module graph per
      // test file) next to the archives. The upload in chromatic.yml runs with
      // `--only-changed`, which requires that file once Chromatic unlocks
      // TurboSnap for the project — without it the CLI fails the upload rather
      // than falling back to a full build.
      turboSnap: chromaticEnabled,
      // Outside capture runs, skip the per-test wait for fonts and network idle
      // that only matters for archiving resources.
      ...(chromaticEnabled ? {} : {resourceArchiveTimeout: 0}),
      reporter: chromaticEnabled,
    }),
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
    deps: {
      optimizer: {
        client: {
          // Pre-bundle the Chromatic test helpers so that the first test file
          // to import `configure()`/`takeSnapshot()` cannot trigger a mid-run
          // dependency re-optimization, which reloads the browser page and
          // fails the file with "Vitest failed to find the current suite".
          include: ['@chromatic-com/vitest'],
        },
      },
    },
    typecheck: {
      enabled: true,
      ignoreSourceErrors: true,
    },
  },
})
