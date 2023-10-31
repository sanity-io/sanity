import os from 'os'
import {type PlaywrightTestConfig, devices} from '@playwright/test'
import {CreatePlaywrightConfigOptions} from './types'

// Paths
const TESTS_PATH = './test/e2e/tests'
const HTML_REPORT_PATH = './test/e2e/report'
const ARTIFACT_OUTPUT_PATH = './test/e2e/results'

// OS-specific browsers to include
const OS_BROWSERS =
  os.platform() === 'darwin' ? [{name: 'webkit', use: {...devices['Desktop Safari']}}] : []

// Read environment variables
const CI = readBoolEnv('CI', false)
const E2E_DEBUG = readBoolEnv('SANITY_E2E_DEBUG', false)
const BASE_URL = 'http://localhost:3333'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const defaultConfig: PlaywrightTestConfig = {
  globalSetup: './test/e2e/globalSetup',
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
    command: 'yarn dev',
    port: 3333,
    reuseExistingServer: !CI,
    stdout: 'pipe',
  },
}

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
function getStorageStateForProjectId({
  projectId,
  token,
  baseUrl,
}: {
  projectId: string
  token: string
  baseUrl: string
}) {
  return {
    cookies: [],
    origins: [
      {
        origin: baseUrl,
        localStorage: [
          {
            name: `__studio_auth_token_${projectId}`,
            value: JSON.stringify({
              token: token,
              time: new Date().toISOString(),
            }),
          },
        ],
      },
    ],
  }
}

/**
 * Create a Playwright test config object.
 *
 * @param options - Options to override the default config
 * @returns A Playwright test config object
 * @public
 */
export function createPlaywrightConfig(
  options: CreatePlaywrightConfigOptions,
): PlaywrightTestConfig {
  const {playwrightOptions, projectId, token} = options

  if (typeof playwrightOptions === 'function') {
    const config = {
      ...defaultConfig,
    }

    const mergedConfig = playwrightOptions(config)

    return {
      ...mergedConfig,
      use: {
        ...mergedConfig.use,
        storageState: getStorageStateForProjectId({
          projectId,
          token,
          baseUrl: mergedConfig?.use?.baseURL || BASE_URL,
        }),
      },
    }
  } else if (typeof playwrightOptions === 'object') {
    const config = {
      ...defaultConfig,
      use: {
        ...defaultConfig.use,
        storageState: getStorageStateForProjectId({
          projectId,
          token,
          baseUrl: playwrightOptions?.use?.baseURL || BASE_URL,
        }),
      },
    }
    return {...config, ...playwrightOptions}
  }

  return defaultConfig
}
