import {defineConfig, type PlaywrightTestConfig, type PlaywrightTestProject} from '@playwright/test'
import {createPlaywrightConfig} from '@sanity/test'

import {loadEnvFiles} from './scripts/utils/loadEnvFiles'
import {readBoolEnv, readEnv} from './test/e2e/helpers/envVars'

loadEnvFiles()

const CI = readBoolEnv('CI', false)
const HEADLESS = readBoolEnv('HEADLESS', true)

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
    const chromiumOptions = {
      permissions: ['clipboard-read', 'clipboard-write'],
      contextOptions: {
        // chromium-specific permissions
        permissions: ['clipboard-read', 'clipboard-write'],
      },
    }

    const autoUpdatingProjects: PlaywrightTestProject[] = []
    // for now, only test auto-updating on chromium
    if (config.projects?.find((project) => project.name === 'chromium')) {
      autoUpdatingProjects.push({
        ...config.projects.find((project) => project.name === 'chromium'),
        name: 'auto-updating',
        ...chromiumOptions,
      })
    }

    const projects = [
      ...autoUpdatingProjects,
      ...(config?.projects?.map((project) => {
        const projectConfig = {
          ...project,
        }

        if (project.name === 'chromium') {
          return {
            ...projectConfig,
            ...chromiumOptions,
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
          }
        }

        return projectConfig
      }) || []),
    ]

    return {
      ...config,
      reporter: excludeGithub(config.reporter),
      use: {
        ...config.use,
        baseURL: 'http://localhost:3339',
        headless: HEADLESS,
      },
      projects,
      webServer: {
        ...config.webServer,
        command: CI ? 'pnpm e2e:start' : 'pnpm e2e:dev',
        port: 3339,
      },
    }
  },
})

export default defineConfig(playwrightConfig)
