import {defineConfig, devices} from '@playwright/test'

const CI = process.env.CI === 'true'
const PORT = 3340

/**
 * Playwright config for auth-related e2e tests.
 * Uses dev/auth-test-studio on port 3340 with cookie and token workspaces.
 * Tests mock all auth APIs — no real credentials needed.
 *
 * Local dev: start the studio yourself first:
 *   pnpm --filter auth-test-studio dev --port 3340
 *
 * CI: the webServer block auto-starts the preview server.
 */
export default defineConfig({
  testDir: './tests/auth',
  timeout: 60_000,
  fullyParallel: true,
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
  // In local dev, the studio must already be running on the port.
  // In CI, Playwright starts the preview server automatically.
  ...(CI
    ? {
        webServer: {
          command: `pnpm sanity preview --port ${PORT}`,
          port: PORT,
          cwd: '../dev/auth-test-studio',
          reuseExistingServer: false,
          stdout: 'pipe',
        },
      }
    : {}),
})
