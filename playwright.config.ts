/* eslint-disable no-process-env */
import os from 'os'
import fs from 'fs/promises'
import path from 'path'
import {defineConfig, devices} from '@playwright/test'
import {loadEnvFiles} from './scripts/utils/loadEnvFiles'

const CI = Boolean(process.env.CI)
const TESTS_PATH = path.join(__dirname, 'test', 'e2e', 'tests')
const HTML_REPORT_PATH = path.join(__dirname, 'test', 'e2e', 'report')
const ARTIFACT_OUTPUT_PATH = path.join(__dirname, 'test', 'e2e', 'results')
const STORAGE_STATE_PATH = path.join(__dirname, 'test', 'e2e', 'state', 'storageState.json')
const OS_BROWSERS =
  os.platform() === 'darwin' ? [{name: 'webkit', use: {...devices['Desktop Safari']}}] : []

loadEnvFiles()
ensureStorageState()

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: require.resolve('./test/e2e/global-setup'),
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
  reporter: CI ? 'github' : [['list'], ['html', {outputFolder: HTML_REPORT_PATH}]],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 10000,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    baseURL: 'http://localhost:3333/',
    headless: readBoolEnv('SANITY_E2E_HEADLESS', true),
    storageState: STORAGE_STATE_PATH,
    viewport: {width: 1728, height: 1000},
    contextOptions: {reducedMotion: 'reduce'},
  },

  /* Configure projects for major browsers */
  projects: [
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

  return flag === 'true' || flag === '1' || flag === 'yes'
}

/**
 * Ensures that the file we use for storing state exists.
 * If it does not, we create a file containing an empty JSON object.
 * @internal
 */
async function ensureStorageState() {
  try {
    await fs.writeFile(STORAGE_STATE_PATH, JSON.stringify({}), {
      encoding: 'utf8',
      flag: 'wx',
    })
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err
    }
  }
}
