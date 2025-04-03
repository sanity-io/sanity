import {defineConfig, type PlaywrightTestConfig} from '@playwright/test'
import {createPlaywrightConfig} from '@sanity/test'

import {loadEnvFiles} from './scripts/utils/loadEnvFiles'
import {readBoolEnv, readEnv} from './test/e2e/helpers/envVars'

loadEnvFiles()

const CI = readBoolEnv('CI', false)
const HEADLESS = readBoolEnv('HEADLESS', true)
const BASE_URL = readEnv('SANITY_E2E_BASE_URL')

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

const playwrightConfig = createPlaywrightConfig({
  projectId: readEnv('SANITY_E2E_PROJECT_ID'),
  token: readEnv('SANITY_E2E_SESSION_TOKEN'),
  playwrightOptions(config): PlaywrightTestConfig {
    const projects = [
      ...(config?.projects?.map((project) => {
        const projectConfig = {
          ...project,
        }

        if (project.name === 'chromium') {
          return {
            ...projectConfig,
            permissions: ['clipboard-read', 'clipboard-write'],
            launchOptions: {
              args: ['--disable-gpu', '--disable-software-rasterizer'],
            },
            contextOptions: {
              ...projectConfig.use?.contextOptions,
              // chromium-specific permissions
              permissions: ['clipboard-read', 'clipboard-write'],
              reducedMotion: 'reduce',
            },
          }
        }

        if (project.name === 'firefox') {
          return {
            ...projectConfig,
            launchOptions: {
              firefoxUserPrefs: {
                'dom.events.asyncClipboard.readText': true,
                'dom.events.testing.asyncClipboard': true,
              },
            },
            contextOptions: {
              ...projectConfig.use?.contextOptions,
              reducedMotion: 'reduce',
            },
          }
        }

        return projectConfig
      }) || []),
    ]

    return {
      ...config,
      /* We allow 1 retry to root out flaky tests */
      retries: 1,
      reporter: excludeGithub([['list'], ['blob']]),
      use: {
        ...config.use,
        video: 'retain-on-failure',
        baseURL: BASE_URL,
        headless: HEADLESS,
        contextOptions: {reducedMotion: 'reduce'},
      },
      projects,
      webServer:
        // Using deployed site, no need to run web server
        BASE_URL.includes('.sanity.dev')
          ? undefined
          : {
              ...config.webServer,
              command: CI ? 'pnpm e2e:start' : 'pnpm e2e:dev',
              port: 3339,
            },
    }
  },
})

export default defineConfig(playwrightConfig)
