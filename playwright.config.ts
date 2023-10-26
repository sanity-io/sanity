// NOTE: load env files before other imports
// eslint-disable-next-line import/order
import {SANITY_E2E_SESSION_TOKEN} from './test/e2e/env'

import os from 'os'
import path from 'path'
import {defineConfig, devices} from '@playwright/test'

// Paths
const TESTS_PATH = path.join(__dirname, 'test', 'e2e', 'tests')
const HTML_REPORT_PATH = path.join(__dirname, 'test', 'e2e', 'report')
const ARTIFACT_OUTPUT_PATH = path.join(__dirname, 'test', 'e2e', 'results')

// OS-specific browsers to include
const OS_BROWSERS =
  os.platform() === 'darwin' ? [{name: 'webkit', use: {...devices['Desktop Safari']}}] : []

// Read environment variables
const CI = readBoolEnv('CI', false)
const E2E_DEBUG = readBoolEnv('SANITY_E2E_DEBUG', false)
const PROJECT_ID = process.env.SANITY_E2E_PROJECT_ID!

const BASE_URL = 'http://localhost:3339/'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: require.resolve('./test/e2e/globalSetup'),

  testDir: TESTS_PATH,

  /* Maximum time one test can run for. */
  timeout: 30 * 1000,

  retries: 1,

  fullyParallel: true,

  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 1000 * 60 * 5,
  },

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: CI ? [['github'], ['blob']] : [['list'], ['html', {outputFolder: HTML_REPORT_PATH}]],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 10000,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    baseURL: BASE_URL,
    headless: readBoolEnv('SANITY_E2E_HEADLESS', !E2E_DEBUG),
    storageState: getStorageStateForProjectId(PROJECT_ID),
    viewport: {width: 1728, height: 1000},
    contextOptions: {reducedMotion: 'reduce'},
    video: {mode: 'on-first-retry'},
  },

  /* Configure projects for major browsers */
  projects: E2E_DEBUG
    ? [
        {
          name: 'chromium',
          use: {...devices['Desktop Chrome']},
        },
      ]
    : [
        {
          name: 'chromium',
          use: {...devices['Desktop Chrome']},
        },

        {
          name: 'firefox',
          use: {...devices['Desktop Firefox']},
        },

        ...OS_BROWSERS,
      ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: ARTIFACT_OUTPUT_PATH,

  /* Run your local dev server before starting the tests */
  webServer: {
    /**
     * If it is running in CI just start the production build assuming that studio is already build
     * Locally run the dev server
     */
    command: CI ? 'yarn e2e:start' : 'yarn e2e:dev',
    port: 3339,
    reuseExistingServer: !CI,
    stdout: 'pipe',
  },
})

/**
 * Read an environment variable, parsing the response as a boolean, using loose
 * constraints (`true`, `1`, `yes` are all considered true, everything else is false)
 *
 * @param flag - The environment variable to read, eg `SOME_FLAG`
 * @param defaultValue - The default value to use if it is not set
 * @returns A boolean value
 * @internal
 */
function readBoolEnv(flag: string, defaultValue: boolean) {
  const value = process.env[flag]
  if (value === undefined) {
    return defaultValue
  }

  return value === 'true' || value === '1' || value === 'yes'
}

/**
 * Returns a storage state with an auth token injected to the localstorage for the given project ID
 *
 * @param projectId - The ID of the project the auth token belongs to
 * @returns A storage state object
 * @internal
 */
function getStorageStateForProjectId(projectId: string) {
  return {
    cookies: [],
    origins: [
      {
        origin: BASE_URL,
        localStorage: [
          {
            name: `__studio_auth_token_${projectId}`,
            value: JSON.stringify({
              token: SANITY_E2E_SESSION_TOKEN,
              time: new Date().toISOString(),
            }),
          },
        ],
      },
    ],
  }
}
