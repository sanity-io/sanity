import os from 'node:os'

import {
  defineConfig,
  devices,
  type PlaywrightTestConfig,
  type PlaywrightTestProject,
} from '@playwright/test'

import {loadEnvFiles} from './scripts/utils/loadEnvFiles'
import {readBoolEnv, readEnv} from './test/e2e/helpers/envVars'

loadEnvFiles()

// Read environment variables
const CI = readBoolEnv('CI', false)
const HEADLESS = readBoolEnv('HEADLESS', true)
const BASE_URL = readEnv('SANITY_E2E_BASE_URL') || 'http://localhost:3333'
const PROJECT_ID = readEnv('SANITY_E2E_PROJECT_ID')
const TOKEN = readEnv('SANITY_E2E_SESSION_TOKEN')
const E2E_DEBUG = readBoolEnv('SANITY_E2E_DEBUG', false)

// Paths
const TESTS_PATH = './test/e2e/tests'
const ARTIFACT_OUTPUT_PATH = './test/e2e/results'

// OS-specific browsers to include
const OS_BROWSERS =
  os.platform() === 'darwin' ? [{name: 'webkit', use: {...devices['Desktop Safari']}}] : []

/**
 * Excludes the GitHub reporter until https://github.com/microsoft/playwright/issues/19817 is resolved, since it creates a lot of noise in our PRs.
 * @param reporters - The reporters config to exclude the github reporter from
 */
function excludeGithub(reporters: PlaywrightTestConfig['reporter']) {
  if (Array.isArray(reporters)) {
    return reporters.filter((reporterDescription) => reporterDescription[0] !== 'github')
  }
  return reporters === 'github' ? undefined : reporters
}

const CHROMIUM_PROJECT: PlaywrightTestProject = {
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `${BASE_URL}/chromium`,

    permissions: ['clipboard-read', 'clipboard-write'],
    launchOptions: {
      args: ['--disable-gpu', '--disable-software-rasterizer'],
    },
    contextOptions: {
      // chromium-specific permissions
      permissions: ['clipboard-read', 'clipboard-write'],
      reducedMotion: 'reduce',
    },
  },
}

const FIREFOX_PROJECT: PlaywrightTestProject = {
  name: 'firefox',
  use: {
    ...devices['Desktop Firefox'],
    baseURL: `${BASE_URL}/firefox`,

    launchOptions: {
      firefoxUserPrefs: {
        'dom.events.asyncClipboard.readText': true,
        'dom.events.testing.asyncClipboard': true,
      },
    },
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },
}
/**
 * See https://playwright.dev/docs/test-configuration.
 */
const playwrightConfig: PlaywrightTestConfig = {
  globalSetup: './test/e2e/globalSetup',
  testDir: TESTS_PATH,

  /* Maximum time one test can run for. */
  timeout: 30 * 1000,

  fullyParallel: true,

  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 1000 * 60 * 5,
  },
  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: ARTIFACT_OUTPUT_PATH,

  retries: 1,
  reporter: excludeGithub([['list'], ['blob']]),
  use: {
    actionTimeout: 10000,
    trace: 'on-first-retry',
    viewport: {width: 1728, height: 1000},
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE_URL,
          localStorage: [
            {
              name: `__studio_auth_token_${PROJECT_ID}`,
              value: JSON.stringify({
                token: TOKEN,
                time: new Date().toISOString(),
              }),
            },
          ],
        },
      ],
    },
    video: 'retain-on-failure',
    baseURL: BASE_URL,
    headless: HEADLESS,
    contextOptions: {reducedMotion: 'reduce'},
  },

  /* Configure projects for major browsers */
  projects: E2E_DEBUG ? [CHROMIUM_PROJECT] : [CHROMIUM_PROJECT, FIREFOX_PROJECT, ...OS_BROWSERS],

  /* Run your local dev server before starting the tests */
  webServer: BASE_URL.includes('.sanity.dev')
    ? undefined
    : {
        /**
         * If it is running in CI just start the production build assuming that studio is already build
         * Locally run the dev server
         */
        command: CI ? 'pnpm e2e:start' : 'pnpm e2e:dev',
        port: 3339,
        reuseExistingServer: !CI,
        stdout: 'pipe',
      },
}

export default defineConfig(playwrightConfig)
