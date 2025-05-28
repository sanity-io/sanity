import path from 'node:path'

import {defineConfig, devices} from '@playwright/experimental-ct-react'
import aliases from '@repo/dev-aliases'

// Paths
const TESTS_PATH = path.join(__dirname, 'playwright-ct', 'tests')
const HTML_REPORT_PATH = path.join(__dirname, 'playwright-ct', 'report')
const ARTIFACT_OUTPUT_PATH = path.join(__dirname, 'playwright-ct', 'results')
const isCI = !!process.env.CI
const monorepoPath = path.resolve(__dirname, '..', '..')

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: TESTS_PATH,

  outputDir: ARTIFACT_OUTPUT_PATH,

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: isCI,
  /* We allow 1 retry to root out flaky tests */
  retries: 1,
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

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: isCI ? 'on-all-retries' : 'retain-on-failure',
    video: isCI ? 'on-first-retry' : 'retain-on-failure',
    /* Port to use for Playwright component endpoint. */
    ctPort: 3100,
    /* Configure Playwright vite config */
    ctViteConfig: {
      resolve: {
        alias: Object.fromEntries(
          Object.entries(aliases).map(([pkgName, pkgPath]) => {
            return [pkgName, path.resolve(monorepoPath, path.join('packages', pkgPath))]
          }),
        ),
        dedupe: ['@sanity/ui', 'styled-components'],
      },
    },
    /* Where to find playwright-ct template files */
    ctTemplateDir: './playwright-ct/template',
    /* Don't wait for animations */
    contextOptions: {reducedMotion: 'reduce'},
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-gpu', '--disable-software-rasterizer'],
        },
        permissions: ['clipboard-read', 'clipboard-write'],
        contextOptions: {
          reducedMotion: 'reduce',
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
