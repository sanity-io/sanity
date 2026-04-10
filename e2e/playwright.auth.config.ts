import {defineConfig, devices} from '@playwright/test'

const CI = process.env.CI === 'true'
const PORT = 3341

/**
 * Playwright config for auth-related e2e tests.
 * Uses dev/auth-test-studio on port 3341 with loginMethod: 'cookie'.
 * Tests mock all auth APIs — no real credentials needed.
 */
export default defineConfig({
  testDir: './tests/auth',
  timeout: 60_000,
  fullyParallel: false,
  expect: {
    timeout: 30_000,
  },
  outputDir: './results-auth',
  retries: 1,
  reporter: [['list']],
  use: {
    actionTimeout: 10_000,
    trace: 'on-first-retry',
    viewport: {width: 1728, height: 1000},
    video: 'retain-on-failure',
    baseURL: `http://localhost:${PORT}`,
    headless: true,
    contextOptions: {reducedMotion: 'reduce'},
  },
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },
  ],
  webServer: {
    command: `pnpm sanity preview --port ${PORT}`,
    port: PORT,
    cwd: '../dev/auth-test-studio',
    reuseExistingServer: !CI,
    stdout: 'pipe',
  },
})
