import {defineConfig, devices} from '@playwright/test'

/**
 * Playwright config for the auto-updating studio tests: the test starts its own servers, models
 * the module CDN (a cross-origin redirect to a bucket) and mocks every Sanity API request, so no
 * credentials are needed. Needs the CDN bundle built first: `pnpm --filter sanity build:bundle`.
 */
export default defineConfig({
  testDir: './tests/cdn',
  timeout: 60_000,
  fullyParallel: true,
  expect: {
    timeout: 15_000,
  },
  outputDir: './results-cdn',
  retries: 0,
  reporter: [['list']],
  use: {
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
    viewport: {width: 1728, height: 1000},
    video: 'retain-on-failure',
    headless: true,
    contextOptions: {reducedMotion: 'reduce'},
  },
  projects: [
    {name: 'chromium', use: {...devices['Desktop Chrome']}},
    {name: 'webkit', use: {...devices['Desktop Safari']}},
  ],
})
