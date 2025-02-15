import path from 'node:path'

import {defineConfig, devices} from '@playwright/experimental-ct-react'

// Paths
const TESTS_PATH = path.join(__dirname, 'playwright-ct', 'tests')
const HTML_REPORT_PATH = path.join(__dirname, 'playwright-ct', 'report')
const ARTIFACT_OUTPUT_PATH = path.join(__dirname, 'playwright-ct', 'results')
const isCI = !!process.env.CI

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: TESTS_PATH,

  outputDir: ARTIFACT_OUTPUT_PATH,

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 6 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: isCI
    ? [['list'], ['blob']]
    : [
        ['list'],
        ['html', {outputFolder: HTML_REPORT_PATH}],
        [
          'json',
          {
            outputFile: path.join(ARTIFACT_OUTPUT_PATH, 'playwright-ct-test-results.json'),
          },
        ],
      ],

  /* Maximum time one test can run for. */
  timeout: 60 * 1000,
  expect: {
    // Maximum time expect() should wait for the condition to be met.
    timeout: 40 * 1000,
  },

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 40 * 1000,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: isCI ? 'on-all-retries' : 'retain-on-failure',
    video: isCI ? 'on-first-retry' : 'retain-on-failure',
    /* Port to use for Playwright component endpoint. */
    ctPort: 3100,
    /* Configure Playwright vite config */
    /*
    ctViteConfig: {
      resolve: {
        alias: {
          '@sanity/util/content': path.join(
            __dirname,
            './packages/@sanity/util/src/content/index.ts'
          ),
        },
      },
    },
    */
    /* Where to find playwright-ct template files */
    ctTemplateDir: './playwright-ct/template',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['clipboard-read', 'clipboard-write'],
        contextOptions: {
          // chromium-specific permissions
          permissions: ['clipboard-read', 'clipboard-write'],
        },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'dom.events.asyncClipboard.readText': true,
            'dom.events.testing.asyncClipboard': true,
          },
        },
      },
    },
    {name: 'webkit', use: {...devices['Desktop Safari']}},
  ],
})
