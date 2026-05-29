import os from 'node:os'

import {
  defineConfig,
  devices,
  type PlaywrightTestConfig,
  type PlaywrightTestProject,
} from '@playwright/test'
import {loadEnvFiles} from '@repo/utils'

import {findEnv, readBoolEnv, readEnv} from './helpers/envVars'

loadEnvFiles()

// Read environment variables
const CI = readBoolEnv('CI', false)
const HEADLESS = readBoolEnv('HEADLESS', true)
const BASE_URL = findEnv('SANITY_E2E_BASE_URL') || 'http://localhost:3339'
const PROJECT_ID = readEnv('SANITY_E2E_PROJECT_ID')
const TOKEN = readEnv('SANITY_E2E_SESSION_TOKEN')
const E2E_DEBUG = readBoolEnv('SANITY_E2E_DEBUG', false)

// Paths
const TESTS_PATH = './tests'
const ARTIFACT_OUTPUT_PATH = './results'

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
 * Build options for the `blob` reporter with a collision-proof file name.
 *
 * In CI all shards' blob reports are downloaded with `merge-multiple` and flattened into a
 * single directory before merging. The default blob name is `report-<shard>.zip`, which is
 * NOT unique across projects — chromium shard 1 and firefox shard 1 both write `report-1.zip`
 * and silently overwrite each other, so the merge drops half the reports. Prefixing with the
 * project name (passed as `PWTEST_BLOB_REPORT_NAME` by the workflow) makes each blob unique.
 *
 * Outside CI the env var is unset and we fall back to Playwright's default name.
 */
function getBlobReporterOptions(): {fileName?: string} {
  const project = process.env.PWTEST_BLOB_REPORT_NAME
  if (!project) return {}
  // Mirror Playwright's default `--shard X/Y` -> `report-<current>.zip` suffix.
  const shardIndex = process.argv.findIndex((arg) => arg.startsWith('--shard'))
  const shardArg =
    shardIndex === -1
      ? undefined
      : process.argv[shardIndex].includes('=')
        ? process.argv[shardIndex].split('=')[1]
        : process.argv[shardIndex + 1]
  const current = shardArg?.split('/')[0]
  return {fileName: current ? `report-${project}-${current}.zip` : `report-${project}.zip`}
}

const BLOB_REPORTER_OPTIONS = getBlobReporterOptions()

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const playwrightConfig: PlaywrightTestConfig = {
  globalSetup: './globalSetup',
  testDir: TESTS_PATH,
  // Auth tests use a separate config (playwright.auth.config.ts) with their own
  // dev server on port 3340. Exclude them from the default config.
  testIgnore: ['**/tests/auth/**'],

  /* Maximum time one test can run for. */
  timeout: 60_000,

  fullyParallel: true,

  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 30_000,
  },
  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: ARTIFACT_OUTPUT_PATH,

  retries: 2,
  reporter: excludeGithub([['list'], ['blob', BLOB_REPORTER_OPTIONS]]),
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
        command: CI ? 'pnpm start' : 'pnpm dev',
        port: 3339,
        reuseExistingServer: !CI,
        stdout: 'pipe',
      },
}

export default defineConfig(playwrightConfig)
