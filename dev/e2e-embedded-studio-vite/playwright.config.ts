import {
  defineConfig,
  devices,
  type PlaywrightTestConfig,
  type PlaywrightTestProject,
} from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const PROJECT_ID = process.env.SANITY_E2E_PROJECT_ID
const TOKEN = process.env.SANITY_E2E_SESSION_TOKEN
const CI = process.env.CI === 'true'

const CHROMIUM_PROJECT: PlaywrightTestProject = {
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: BASE_URL,

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
    baseURL: BASE_URL,

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

const playwrightConfig: PlaywrightTestConfig = {
  fullyParallel: true,
  testDir: './tests',
  use: {
    baseURL: BASE_URL,
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
  },
  projects: [CHROMIUM_PROJECT, FIREFOX_PROJECT],
  webServer: {
    command: CI ? 'pnpm start' : 'pnpm dev',
    port: 5173,
    reuseExistingServer: !CI,
    stdout: 'pipe',
  },
}

export default defineConfig(playwrightConfig)
