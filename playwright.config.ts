/* eslint-disable no-process-env */
import os from 'os'
import path from 'path'
import {defineConfig, devices} from '@playwright/test'
import {loadEnvFiles} from './scripts/utils/loadEnvFiles'

// Paths
const TESTS_PATH = path.join(__dirname, 'test', 'e2e', 'tests')
const HTML_REPORT_PATH = path.join(__dirname, 'test', 'e2e', 'report')
const ARTIFACT_OUTPUT_PATH = path.join(__dirname, 'test', 'e2e', 'results')

// OS-specific browsers to include
const OS_BROWSERS =
  os.platform() === 'darwin' ? [{name: 'webkit', use: {...devices['Desktop Safari']}}] : []

// Load environment variables from env + dotenv files
loadEnvFiles()

// Read environment variables
const CI = readBoolEnv('CI', false)
const E2E_DEBUG = readBoolEnv('SANITY_E2E_DEBUG', false)
const AUTH_TOKEN = process.env.SANITY_E2E_SESSION_TOKEN
const PROJECT_ID = 'ppsg7ml5'

if (!AUTH_TOKEN) {
  throw new Error('Missing sanity token - see README.md for details')
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: require.resolve('./test/e2e/globalSetup'),

  testDir: TESTS_PATH,

  /* Maximum time one test can run for. */
  timeout: 30 * 1000,

  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 1000 * 60 * 5,
  },

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: CI
    ? [['github'], ['html', {outputFolder: HTML_REPORT_PATH}]]
    : [['list'], ['html', {outputFolder: HTML_REPORT_PATH}]],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 10000,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    baseURL: 'http://localhost:3333/',
    headless: readBoolEnv('SANITY_E2E_HEADLESS', !E2E_DEBUG),
    storageState: getStorageStateForProjectId(PROJECT_ID),
    viewport: {width: 1728, height: 1000},
    contextOptions: {reducedMotion: 'reduce'},
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
    command: 'npm run dev',
    port: 3333,
    reuseExistingServer: !process.env.CI,
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
        origin: 'http://localhost:3333',
        localStorage: [
          {
            name: `__studio_auth_token_${projectId}`,
            value: JSON.stringify({token: AUTH_TOKEN, time: new Date().toISOString()}),
          },
        ],
      },
    ],
  }
}
